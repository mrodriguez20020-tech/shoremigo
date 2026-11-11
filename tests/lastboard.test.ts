import { describe, expect, it } from "vitest";
import { POLICY, getExcursion, getPort, excursionsForPort } from "@/lib/domain/catalog";
import { checkFeasibility } from "@/lib/domain/feasibility";
import { planRescue } from "@/lib/domain/rescue";
import { buildSchedule, resourceClashes } from "@/lib/domain/schedule";
import { centsToPaypal, paypalToCents, toMin } from "@/lib/domain/time";
import type { Booking } from "@/lib/domain/types";

const coz = getPort("cozumel")!;
const palancar = getExcursion("coz-palancar-snorkel")!;

function booking(over: Partial<Booking> = {}): Booking {
  return {
    id: "b1",
    ref: "SM-TEST1",
    excursionId: palancar.id,
    originalExcursionId: palancar.id,
    guests: 2,
    firstName: "Ana",
    lastName: "Test",
    email: "a@example.com",
    unitPriceCents: palancar.priceCents,
    totalCents: palancar.priceCents * 2,
    paidCents: palancar.priceCents * 2,
    status: "confirmed",
    createdAt: "",
    updatedAt: "",
    payments: [],
    ...over,
  };
}

describe("LastBoard feasibility", () => {
  it("accepts the Palancar snorkel on schedule", () => {
    const f = checkFeasibility(coz, palancar, POLICY);
    // arrive 8:00 + 30 disembark + 20 transfer = 8:50 ready, departs 9:15
    expect(f.timeline.readyAtMeetingPoint).toBe(toMin("08:50"));
    expect(f.status).toBe("tight"); // 25 min start slack < 30
    expect(f.slackMin).toBe(25);
  });

  it("rejects it after a 90 minute delay with a clear reason", () => {
    const f = checkFeasibility(coz, palancar, POLICY, { delayMin: 90 });
    expect(f.status).toBe("infeasible");
    expect(f.timeline.readyAtMeetingPoint).toBe(toMin("10:20"));
    expect(f.reasons[0]).toMatch(/departs at 9:15 AM/);
  });

  it("rejects tours that would return after the safety cut-off", () => {
    // Blue Hole: 14:00 + 210 + 35 = 17:45 back; Ocho Rios all-aboard 21:30 → fine. Shrink all-aboard instead.
    const port = { ...getPort("ocho-rios")!, allAboard: "18:00" };
    const f = checkFeasibility(port, getExcursion("och-blue-hole")!, POLICY);
    expect(f.status).toBe("infeasible");
    expect(f.reasons.join(" ")).toMatch(/safety cut-off/);
  });

  it("shifts a flexible tour's departure to when guests are ready", () => {
    const f = checkFeasibility(coz, getExcursion("coz-punta-sur")!, POLICY, { delayMin: 120 });
    expect(f.timeline.departs).toBe(toMin("10:45")); // 10:00 + 30 + 15
    expect(f.status).not.toBe("infeasible");
  });

  it("adds tender time at tender ports", () => {
    const gcm = getPort("grand-cayman")!;
    const f = checkFeasibility(gcm, getExcursion("gcm-stingray")!, POLICY);
    expect(f.timeline.readyAtMeetingPoint).toBe(toMin("07:00") + 30 + 25 + 20);
  });

  it("validates inputs", () => {
    expect(() => checkFeasibility(coz, palancar, POLICY, { delayMin: -5 })).toThrow();
    expect(() => checkFeasibility(getPort("roatan")!, palancar, POLICY)).toThrow();
  });
});

describe("LastBoard rescue planner", () => {
  it("proposes the afternoon reef first, with a refund of the difference", () => {
    const opts = planRescue({
      booking: booking(),
      port: coz,
      original: palancar,
      candidates: excursionsForPort("cozumel"),
      seatsLeft: () => 10,
      policy: POLICY,
      delay: { delayMin: 90 },
    });
    expect(opts[0].excursionId).toBe("coz-afternoon-reef");
    expect(opts[0].deltaCents).toBe((7900 - 8900) * 2);
    expect(opts.every((o) => o.kind === "cancel_refund" || o.feasibility!.status !== "infeasible")).toBe(true);
    expect(opts.at(-1)!.kind).toBe("cancel_refund");
    expect(opts.at(-1)!.deltaCents).toBe(-17800);
  });

  it("skips alternatives without enough seats", () => {
    const opts = planRescue({
      booking: booking(),
      port: coz,
      original: palancar,
      candidates: excursionsForPort("cozumel"),
      seatsLeft: (id) => (id === "coz-afternoon-reef" ? 1 : 10),
      policy: POLICY,
      delay: { delayMin: 90 },
    });
    expect(opts.find((o) => o.excursionId === "coz-afternoon-reef")).toBeUndefined();
  });

  it("offers only a full refund when nothing fits", () => {
    const opts = planRescue({
      booking: booking(),
      port: coz,
      original: palancar,
      candidates: excursionsForPort("cozumel"),
      seatsLeft: () => 10,
      policy: POLICY,
      delay: { delayMin: 360 },
    });
    expect(opts).toHaveLength(1);
    expect(opts[0].kind).toBe("cancel_refund");
  });
});

describe("Operator schedule model", () => {
  it("flags booked runs that become infeasible as conflicts", () => {
    const s = buildSchedule("cozumel", { "coz-palancar-snorkel": 4 }, { delayMin: 90, allAboardExtensionMin: 0 });
    const ev = s.events.find((e) => e.id === "coz-palancar-snorkel")!;
    expect(ev.conflict).toBe(true);
    expect(s.arriveMin).toBe(toMin("09:30"));
  });

  it("the demo catalog has no guide/vehicle double-bookings", () => {
    // Ana + Dive boat Coral run both Cozumel reef trips back-to-back.
    const s = buildSchedule("cozumel", { "coz-palancar-snorkel": 2, "coz-afternoon-reef": 2 });
    expect(resourceClashes(s)).toEqual([]);
  });

  it("detects a resource double-booked on overlapping runs", () => {
    const s = buildSchedule("cozumel", { "coz-palancar-snorkel": 2, "coz-afternoon-reef": 2 });
    const reef = s.events.find((e) => e.id === "coz-afternoon-reef")!;
    reef.startMin = s.events.find((e) => e.id === "coz-palancar-snorkel")!.endMin - 5;
    const clashes = resourceClashes(s);
    expect(clashes.map((c) => c.resourceId).sort()).toEqual(["guide-ana", "vehicle-boat-2"]);
  });
});

describe("money formatting", () => {
  it("round-trips cents and PayPal strings exactly", () => {
    expect(centsToPaypal(17800)).toBe("178.00");
    expect(centsToPaypal(5)).toBe("0.05");
    expect(paypalToCents("178.00")).toBe(17800);
    expect(paypalToCents("12.5")).toBe(1250);
    expect(() => paypalToCents("1e3")).toThrow();
    expect(() => centsToPaypal(1.5)).toThrow();
  });
});

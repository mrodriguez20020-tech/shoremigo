import { describe, expect, it } from "vitest";
import { initialMigo, migoReducer, type MigoState } from "@/components/migo/machine";
import { adventureMatch } from "@/lib/domain/match";
import { EXCURSIONS } from "@/lib/domain/catalog";

const run = (events: Parameters<typeof migoReducer>[1][], start: MigoState = initialMigo, now = 1000) =>
  events.reduce((s, e) => migoReducer(s, e, now), start);

describe("Migo state machine", () => {
  it("celebrates only on a verified booking event", () => {
    const s = run([{ type: "checkout:entered" }, { type: "concierge:replied", mood: "excited" }]);
    expect(s.expression).not.toBe("celebrating");
    const v = run([{ type: "booking:verified", ref: "SM-1" }], s);
    expect(v.expression).toBe("celebrating");
  });

  it("docks out of the way during checkout and form focus, and never walks there", () => {
    const s = run([{ type: "checkout:entered" }]);
    expect(s.mode).toBe("docked");
    expect(s.expression).not.toBe("walking");
    const f = run([{ type: "checkout:left" }, { type: "form:focus" }], s);
    expect(f.mode).toBe("docked");
    expect(run([{ type: "form:blur" }], f).mode).toBe("roam");
  });

  it("stays quiet about excursion selections while in checkout", () => {
    const s = run([{ type: "checkout:entered" }, { type: "excursion:selected", excursionId: "x" }]);
    expect(s.expression).toBe("idle");
  });

  it("attends and listens when the concierge opens, thinks while waiting", () => {
    const s = run([{ type: "concierge:opened" }]);
    expect(s.mode).toBe("attend");
    expect(s.expression).toBe("listening");
    const t = run([{ type: "concierge:thinking" }], s);
    expect(t.expression).toBe("thinking");
    // thinking holds until a reply arrives, regardless of ticks
    expect(migoReducer(t, { type: "tick", now: 10_000_000 }).expression).toBe("thinking");
    expect(run([{ type: "concierge:replied", mood: "concerned" }], t).expression).toBe("concerned");
  });

  it("returns to its resting behavior after a transient reaction", () => {
    const s = run([{ type: "app:arrived" }], initialMigo, 0);
    expect(s.expression).toBe("greeting");
    expect(migoReducer(s, { type: "tick", now: 60_000 }).expression).toBe("walking");
  });

  it("can be hidden and shown by the visitor", () => {
    const h = run([{ type: "user:hide" }]);
    expect(h.mode).toBe("hidden");
    expect(run([{ type: "user:show" }], h).mode).toBe("roam");
  });
});

describe("Adventure Match", () => {
  const cands = EXCURSIONS.map((e) => ({ excursion: e, seatsLeft: 10, feasibility: "ok" as const }));

  it("prefers matching vibes and energy", () => {
    const r = adventureMatch({ vibes: ["sail"], energy: 1 }, cands);
    expect(r[0].excursionId).toBe("och-sunset-sail");
    expect(r[0].reasons.join(" ")).toMatch(/sailing/);
  });

  it("never recommends infeasible, sold out, over-budget or too-long tours", () => {
    const c = cands.map((x) =>
      x.excursion.id === "och-sunset-sail" ? { ...x, feasibility: "infeasible" as const } : x.excursion.id === "och-dunns" ? { ...x, seatsLeft: 0 } : x,
    );
    const r = adventureMatch({ vibes: ["sail", "adventure"], energy: 2, budgetUsd: 100, maxMinutes: 240, guests: 2 }, c, 20);
    const ids = r.map((x) => x.excursionId);
    expect(ids).not.toContain("och-sunset-sail");
    expect(ids).not.toContain("och-dunns");
    for (const id of ids) {
      const e = EXCURSIONS.find((x) => x.id === id)!;
      expect(e.priceCents).toBeLessThanOrEqual(10000);
      expect(e.durationMin + e.transferMin + e.returnTransferMin).toBeLessThanOrEqual(240);
    }
  });

  it("filters by port and group size", () => {
    const c = cands.map((x) => (x.excursion.id === "coz-cacao" ? { ...x, seatsLeft: 2 } : x));
    const r = adventureMatch({ vibes: ["food"], energy: 1, portId: "cozumel", guests: 4 }, c, 10);
    expect(r.every((x) => x.excursionId.startsWith("coz-"))).toBe(true);
    expect(r.map((x) => x.excursionId)).not.toContain("coz-cacao");
  });
});

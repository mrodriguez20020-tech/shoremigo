import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakePayPal } from "./fake-paypal";

process.env.PAYPAL_CLIENT_ID = "test-client";
process.env.PAYPAL_CLIENT_SECRET = "test-secret";

const store = await import("@/lib/server/store");
const svc = await import("@/lib/server/bookings");
const paypal = await import("@/lib/server/paypal");
const session = await import("@/lib/server/session");
const { verifyPass } = await import("@/lib/server/pass");

let pp: ReturnType<typeof createFakePayPal>;
beforeEach(() => {
  store.__resetStoreForTests();
  paypal.__resetPayPalTokenForTests();
  pp = createFakePayPal();
  vi.stubGlobal("fetch", pp.fetchImpl);
});
afterEach(() => vi.unstubAllGlobals());

async function paid() {
  const b = await svc.createBooking({ excursionId: "coz-palancar-snorkel", guests: 2, firstName: "Ana", lastName: "Rivera", email: "ana@example.com" });
  const o = await svc.startCheckout(b.id);
  return svc.completeCheckout(b.id, o.id);
}

describe("Shore Pass tokens", () => {
  it("verify only the exact token issued for a booking", () => {
    const t = session.passToken("booking-123");
    expect(session.verifyPassToken(t)).toBe("booking-123");
    expect(session.verifyPassToken(t.slice(0, -1) + (t.endsWith("A") ? "B" : "A"))).toBeNull();
    expect(session.verifyPassToken(t.replace("booking-123", "booking-124"))).toBeNull();
    expect(session.verifyPassToken("")).toBeNull();
    expect(session.verifyPassToken("x".repeat(500))).toBeNull();
  });

  it("are not interchangeable with trip-session tokens", () => {
    const pass = session.passToken("booking-123");
    expect(session.verify(pass)).toBeNull();
    expect(session.verifyPassToken(session.sign("booking-123"))).toBeNull();
  });
});

describe("Shore Pass verification view", () => {
  it("shows a confirmed booking as valid with live timing and no personal or payment data", async () => {
    const b = await paid();
    const v = await verifyPass(session.passToken(b.id));
    expect(v).toMatchObject({ validity: "valid", ref: b.ref, firstName: "Ana", guests: 2, excursion: "Palancar Reef Morning Snorkel", departs: "9:15 AM" });
    const json = JSON.stringify(v);
    expect(json).not.toMatch(/Rivera|ana@example\.com|CAP|ORDER/);
  });

  it("reflects disruption and cancellation live, so a refunded pass stops verifying", async () => {
    const b = await paid();
    const t = session.passToken(b.id);
    await svc.simulateDisruption("cozumel", 90, "operator");
    expect((await verifyPass(t)).validity).toBe("under_review");
    const p = (await svc.openRescueFor(b.id))!;
    await svc.reviewRescue(p.id, "approved");
    await svc.approveRescue(b.id, "opt-cancel", "customer");
    expect((await verifyPass(t)).validity).toBe("not_valid");
  });

  it("does not validate unpaid holds or unknown tokens", async () => {
    const b = await svc.createBooking({ excursionId: "coz-cacao", guests: 1, firstName: "Li", lastName: "Wu", email: "li@example.com" });
    expect((await verifyPass(session.passToken(b.id))).validity).toBe("not_valid");
    expect(await verifyPass("forged.token")).toEqual({ validity: "unknown" });
    expect(await verifyPass(undefined)).toEqual({ validity: "unknown" });
  });
});

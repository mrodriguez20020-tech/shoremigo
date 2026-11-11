import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakePayPal } from "./fake-paypal";

process.env.PAYPAL_CLIENT_ID = "test-client";
process.env.PAYPAL_CLIENT_SECRET = "test-secret";

const store = await import("@/lib/server/store");
const svc = await import("@/lib/server/bookings");
const paypal = await import("@/lib/server/paypal");

let pp: ReturnType<typeof createFakePayPal>;
const guest = { firstName: "Ana", lastName: "Rivera", email: "ana@example.com" };
const row = async (id: string) => (await store.read((db) => svc.inventoryRows(db))).find((r) => r.excursionId === id)!;

beforeEach(() => {
  store.__resetStoreForTests();
  paypal.__resetPayPalTokenForTests();
  pp = createFakePayPal();
  vi.stubGlobal("fetch", pp.fetchImpl);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("operator inventory", () => {
  it("reports confirmed and held seats separately", async () => {
    const paid = await svc.createBooking({ excursionId: "coz-punta-sur", guests: 3, ...guest });
    const order = await svc.startCheckout(paid.id);
    await svc.completeCheckout(paid.id, order.id);
    await svc.createBooking({ excursionId: "coz-punta-sur", guests: 2, ...guest });
    const r = await row("coz-punta-sur");
    expect(r).toMatchObject({ capacity: 12, confirmed: 3, held: 2, holds: 1, seatsLeft: 7, open: true });
    expect(r.nextHoldExpiresAt).not.toBeNull();
  });

  it("refuses to drop capacity below committed seats (no oversell)", async () => {
    await svc.createBooking({ excursionId: "coz-punta-sur", guests: 5, ...guest });
    await expect(svc.updateInventory({ excursionId: "coz-punta-sur", capacity: 4 })).rejects.toMatchObject({ code: "would_oversell", status: 409 });
    const r = await svc.updateInventory({ excursionId: "coz-punta-sur", capacity: 5 });
    expect(r.seatsLeft).toBe(0);
    await expect(svc.createBooking({ excursionId: "coz-punta-sur", guests: 1, ...guest })).rejects.toMatchObject({ code: "sold_out" });
  });

  it("caps capacity at the assigned vehicle and validates input", async () => {
    await expect(svc.updateInventory({ excursionId: "coz-punta-sur", capacity: 13 })).rejects.toMatchObject({ code: "bad_capacity" }); // Van 12-A
    await expect(svc.updateInventory({ excursionId: "coz-punta-sur", capacity: 2.5 })).rejects.toMatchObject({ code: "bad_capacity" });
    await expect(svc.updateInventory({ excursionId: "nope", capacity: 2 })).rejects.toMatchObject({ code: "unknown_excursion" });
    await expect(svc.updateInventory({ excursionId: "coz-punta-sur" })).rejects.toMatchObject({ code: "bad_input" });
  });

  it("closing sales blocks new bookings and hides seats; reopening restores them", async () => {
    await svc.updateInventory({ excursionId: "coz-cacao", open: false });
    await expect(svc.createBooking({ excursionId: "coz-cacao", guests: 1, ...guest })).rejects.toMatchObject({ code: "closed" });
    expect((await row("coz-cacao")).seatsLeft).toBe(0);
    await svc.updateInventory({ excursionId: "coz-cacao", open: true });
    await expect(svc.createBooking({ excursionId: "coz-cacao", guests: 1, ...guest })).resolves.toMatchObject({ status: "pending_payment" });
  });

  it("expired holds release their seats", async () => {
    await svc.createBooking({ excursionId: "coz-punta-sur", guests: 6, ...guest });
    await svc.createBooking({ excursionId: "coz-punta-sur", guests: 6, ...guest });
    expect((await row("coz-punta-sur")).seatsLeft).toBe(0);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 16 * 60_000);
    expect((await row("coz-punta-sur")).seatsLeft).toBe(12);
  });

  it("parallel capacity cut and booking cannot together oversell", async () => {
    await Promise.allSettled([
      svc.createBooking({ excursionId: "coz-punta-sur", guests: 6, ...guest }),
      svc.updateInventory({ excursionId: "coz-punta-sur", capacity: 4 }),
      svc.createBooking({ excursionId: "coz-punta-sur", guests: 6, ...guest }),
    ]);
    const r = await row("coz-punta-sur");
    expect(r.confirmed + r.held).toBeLessThanOrEqual(r.capacity);
  });

  it("every change is audited", async () => {
    await svc.updateInventory({ excursionId: "coz-cacao", capacity: 10 });
    const a = await store.read((db) => db.audit.filter((e) => e.type === "inventory.updated"));
    expect(a).toHaveLength(1);
    expect(a[0].actor).toBe("operator");
  });
});

describe("refused capture recovery (live sandbox finding)", () => {
  it("audits a PayPal-refused capture, keeps the booking unpaid, and lets the buyer retry with a fresh order", async () => {
    const b = await svc.createBooking({ excursionId: "coz-palancar-snorkel", guests: 2, ...guest });
    const first = await svc.startCheckout(b.id);
    pp.opts.complianceNextCapture = true;
    await expect(svc.completeCheckout(b.id, first.id)).rejects.toBeTruthy();
    const after = await svc.getBooking(b.id);
    expect(after).toMatchObject({ status: "pending_payment", paidCents: 0, checkoutAttempt: 1 });
    expect(after!.pendingOrderId).toBeUndefined();
    const ev = await store.read((db) => db.audit.find((e) => e.type === "paypal.capture.failed"));
    expect(ev?.detail).toMatchObject({ code: "COMPLIANCE_VIOLATION", debugId: "fake-debug" });
    const second = await svc.startCheckout(b.id);
    expect(second.id).not.toBe(first.id);
    await expect(svc.completeCheckout(b.id, second.id)).resolves.toMatchObject({ status: "confirmed", paidCents: 17800 });
  });

  it("a declined card keeps the same order so PayPal can offer another funding source", async () => {
    const b = await svc.createBooking({ excursionId: "coz-palancar-snorkel", guests: 1, ...guest });
    const o = await svc.startCheckout(b.id);
    pp.opts.declineNextCapture = true;
    await expect(svc.completeCheckout(b.id, o.id)).rejects.toBeTruthy();
    expect((await svc.getBooking(b.id))!.pendingOrderId).toBe(o.id);
    // Live finding: after a page reload the spent order cannot be reused (PayPal says ORDER_ALREADY_CAPTURED).
    const retry = await svc.startCheckout(b.id);
    expect(retry.id).not.toBe(o.id);
    await expect(svc.completeCheckout(b.id, retry.id)).resolves.toMatchObject({ status: "confirmed" });
    const replaced = await store.read((db) => db.audit.find((e) => e.type === "paypal.order.replaced"));
    expect(replaced?.detail).toMatchObject({ staleOrderId: o.id, attempt: 1 });
  });

  it("an order still awaiting the buyer is reused, not duplicated", async () => {
    const b = await svc.createBooking({ excursionId: "coz-cacao", guests: 1, ...guest });
    const a = await svc.startCheckout(b.id);
    const again = await svc.startCheckout(b.id);
    expect(again.id).toBe(a.id);
    expect(pp.calls.filter((c) => c.method === "POST" && c.path === "/v2/checkout/orders")).toHaveLength(1);
  });
});

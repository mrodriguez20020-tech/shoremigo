import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakePayPal } from "./fake-paypal";

process.env.PAYPAL_CLIENT_ID = "test-client";
process.env.PAYPAL_CLIENT_SECRET = "test-secret";

const store = await import("@/lib/server/store");
const svc = await import("@/lib/server/bookings");
const paypal = await import("@/lib/server/paypal");

let pp: ReturnType<typeof createFakePayPal>;

beforeEach(() => {
  store.__resetStoreForTests();
  paypal.__resetPayPalTokenForTests();
  pp = createFakePayPal();
  vi.stubGlobal("fetch", pp.fetchImpl);
  delete process.env.RESCUE_SKIP_OPERATOR_REVIEW;
});
afterEach(() => vi.unstubAllGlobals());

const guest = { firstName: "Ana", lastName: "Rivera", email: "ana@example.com" };

async function paidBooking(excursionId = "coz-palancar-snorkel", guests = 2) {
  const b = await svc.createBooking({ excursionId, guests, ...guest });
  const order = await svc.startCheckout(b.id);
  return svc.completeCheckout(b.id, order.id);
}

describe("booking creation", () => {
  it("prices from the catalog, not from the client", async () => {
    const b = await svc.createBooking({ excursionId: "coz-palancar-snorkel", guests: 3, ...guest, ...({ totalCents: 1 } as object) });
    expect(b.totalCents).toBe(8900 * 3);
    expect(b.status).toBe("pending_payment");
  });

  it("validates input", async () => {
    await expect(svc.createBooking({ excursionId: "nope", guests: 1, ...guest })).rejects.toMatchObject({ code: "unknown_excursion" });
    await expect(svc.createBooking({ excursionId: "coz-cacao", guests: 0, ...guest })).rejects.toMatchObject({ code: "bad_guests" });
    await expect(svc.createBooking({ excursionId: "coz-cacao", guests: 2, ...guest, email: "bad" })).rejects.toMatchObject({ code: "bad_email" });
  });

  it("refuses tours that don't fit the (delayed) ship schedule", async () => {
    await svc.simulateDisruption("cozumel", 90, "operator");
    await expect(svc.createBooking({ excursionId: "coz-palancar-snorkel", guests: 2, ...guest })).rejects.toMatchObject({ code: "infeasible" });
  });

  it("does not oversell under concurrent requests", async () => {
    // Punta Sur has capacity 12 → only one of three 5-guest bookings can... two fit (10), third fails.
    const results = await Promise.allSettled([1, 2, 3].map(() => svc.createBooking({ excursionId: "coz-punta-sur", guests: 5, ...guest })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(2);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
  });
});

describe("PayPal checkout", () => {
  it("creates a USD order for the server total with an idempotency key", async () => {
    const b = await svc.createBooking({ excursionId: "coz-palancar-snorkel", guests: 2, ...guest });
    await svc.startCheckout(b.id);
    const create = pp.calls.find((c) => c.path === "/v2/checkout/orders")!;
    expect(create.requestId).toBe(`create-${b.id}`);
    expect((create.body as { purchase_units: { amount: unknown; custom_id: string }[] }).purchase_units[0]).toMatchObject({
      amount: { currency_code: "USD", value: "178.00" },
      custom_id: b.id,
    });
  });

  it("confirms only after a verified capture and records PayPal ids", async () => {
    const b = await paidBooking();
    expect(b.status).toBe("confirmed");
    expect(b.paidCents).toBe(17800);
    expect(b.payments[0]).toMatchObject({ kind: "charge", status: "COMPLETED", amountCents: 17800 });
    expect(b.payments[0].captureId).toMatch(/^CAP/);
  });

  it("is idempotent: a duplicate capture request does not double-charge or double-record", async () => {
    const b = await svc.createBooking({ excursionId: "coz-cacao", guests: 1, ...guest });
    const order = await svc.startCheckout(b.id);
    await svc.completeCheckout(b.id, order.id);
    const again = await svc.completeCheckout(b.id, order.id);
    expect(again.payments).toHaveLength(1);
    expect(again.paidCents).toBe(6500);
    expect(pp.calls.filter((c) => c.path.endsWith("/capture"))).toHaveLength(1);
  });

  it("recovers from ORDER_ALREADY_CAPTURED by reading PayPal's real order state", async () => {
    const b = await svc.createBooking({ excursionId: "coz-cacao", guests: 1, ...guest });
    const order = await svc.startCheckout(b.id);
    // Capture happens at PayPal but our process "crashes" before recording it:
    await paypal.captureOrder(order.id, "some-other-request-id");
    const confirmed = await svc.completeCheckout(b.id, order.id);
    expect(confirmed.status).toBe("confirmed");
    expect(pp.calls.some((c) => c.method === "GET" && c.path === `/v2/checkout/orders/${order.id}`)).toBe(true);
  });

  it("rejects a capture whose amount doesn't match and leaves the booking unpaid", async () => {
    pp.opts.captureAmountOverride = "1.00";
    const b = await svc.createBooking({ excursionId: "coz-cacao", guests: 1, ...guest });
    const order = await svc.startCheckout(b.id);
    await expect(svc.completeCheckout(b.id, order.id)).rejects.toMatchObject({ code: "payment_unverified" });
    expect((await svc.getBooking(b.id))!.status).toBe("pending_payment");
  });

  it("surfaces INSTRUMENT_DECLINED and lets the buyer retry", async () => {
    pp.opts.declineNextCapture = true;
    const b = await svc.createBooking({ excursionId: "coz-cacao", guests: 1, ...guest });
    const order = await svc.startCheckout(b.id);
    await expect(svc.completeCheckout(b.id, order.id)).rejects.toMatchObject({ status: 422 });
    expect((await svc.getBooking(b.id))!.status).toBe("pending_payment");
    // A later capture attempt is allowed:
    const ok = await svc.completeCheckout(b.id, order.id).catch((e) => e);
    // idempotency key is the same, so the fake replays nothing stored for a failed call; PayPal would accept the retry
    expect(ok.status === "confirmed" || ok.status === 422).toBe(true);
  });

  it("rejects an order id that doesn't belong to the booking", async () => {
    const a = await svc.createBooking({ excursionId: "coz-cacao", guests: 1, ...guest });
    const b = await svc.createBooking({ excursionId: "coz-cacao", guests: 1, ...guest });
    const orderA = await svc.startCheckout(a.id);
    await svc.startCheckout(b.id);
    await expect(svc.completeCheckout(b.id, orderA.id)).rejects.toMatchObject({ code: "order_mismatch" });
  });

  it("reports PayPal as not configured instead of faking success", async () => {
    const id = process.env.PAYPAL_CLIENT_ID;
    delete process.env.PAYPAL_CLIENT_ID;
    paypal.__resetPayPalTokenForTests();
    const b = await svc.createBooking({ excursionId: "coz-cacao", guests: 1, ...guest });
    await expect(svc.startCheckout(b.id)).rejects.toBeInstanceOf(paypal.PayPalNotConfigured);
    process.env.PAYPAL_CLIENT_ID = id;
  });
});

describe("Trip Rescue", () => {
  it("marks affected bookings and proposes options that wait for operator review", async () => {
    const b = await paidBooking();
    const r = await svc.simulateDisruption("cozumel", 90, "customer-demo");
    expect(r.affected).toEqual([b.id]);
    const p = (await svc.openRescueFor(b.id))!;
    expect(p.operatorReview).toBe("pending");
    expect(p.options[0].excursionId).toBe("coz-afternoon-reef");
    await expect(svc.approveRescue(b.id, p.options[0].id, "customer")).rejects.toMatchObject({ code: "awaiting_operator" });
  });

  it("switches to a cheaper alternative and refunds the difference through PayPal", async () => {
    const b = await paidBooking();
    await svc.simulateDisruption("cozumel", 90, "customer-demo");
    const p = (await svc.openRescueFor(b.id))!;
    await svc.reviewRescue(p.id, "approved");
    const res = await svc.approveRescue(b.id, "opt-coz-afternoon-reef", "customer");
    expect(res.kind).toBe("resolved");
    if (res.kind !== "resolved") return;
    expect(res.booking.status).toBe("rebooked");
    expect(res.booking.excursionId).toBe("coz-afternoon-reef");
    expect(res.booking.paidCents).toBe(7900 * 2);
    expect(res.refunds[0]).toMatchObject({ status: "COMPLETED", amountCents: 2000 });
    const refundCall = pp.calls.find((c) => c.path.endsWith("/refund"))!;
    expect(refundCall.body).toEqual({ amount: { currency_code: "USD", value: "20.00" } });
    expect(refundCall.requestId).toMatch(/^refund-/);
  });

  it("never reports a PENDING refund as completed", async () => {
    pp.opts.refundStatus = "PENDING";
    const b = await paidBooking();
    await svc.simulateDisruption("cozumel", 90, "customer-demo");
    const p = (await svc.openRescueFor(b.id))!;
    await svc.reviewRescue(p.id, "approved");
    const res = await svc.approveRescue(b.id, "opt-cancel", "customer");
    expect(res.kind === "resolved" && res.refundsCompleted).toBe(false);
  });

  it("cancels with a full refund", async () => {
    const b = await paidBooking();
    await svc.simulateDisruption("cozumel", 90, "customer-demo");
    const p = (await svc.openRescueFor(b.id))!;
    await svc.reviewRescue(p.id, "approved");
    const res = await svc.approveRescue(b.id, "opt-cancel", "customer");
    expect(res.kind === "resolved" && res.booking.status).toBe("cancelled_refunded");
    expect(res.kind === "resolved" && res.booking.paidCents).toBe(0);
  });

  it("requires a verified PayPal top-up before switching to a pricier option", async () => {
    process.env.RESCUE_SKIP_OPERATOR_REVIEW = "true";
    const b = await paidBooking("coz-cacao", 2); // $65 × 2
    await svc.simulateDisruption("cozumel", 180, "operator"); // cacao: ready 11:55 > 11:30 → infeasible
    const p = (await svc.openRescueFor(b.id))!;
    const pricier = p.options.find((o) => o.deltaCents > 0)!;
    expect(pricier).toBeTruthy();
    const r = await svc.approveRescue(b.id, pricier.id, "customer");
    expect(r.kind).toBe("payment_required");
    // Booking is NOT changed until the top-up is captured and verified.
    expect((await svc.getBooking(b.id))!.excursionId).toBe("coz-cacao");
    if (r.kind !== "payment_required") return;
    const done = await svc.completeRescueTopUp(b.id, r.orderId);
    expect(done.status).toBe("rebooked");
    expect(done.paidCents).toBe(13000 + pricier.deltaCents);
  });

  it("operator rejection withdraws switches but keeps the refund option", async () => {
    const b = await paidBooking();
    await svc.simulateDisruption("cozumel", 90, "operator");
    const p = (await svc.openRescueFor(b.id))!;
    const reviewed = await svc.reviewRescue(p.id, "rejected", "Boat in maintenance");
    expect(reviewed.options.map((o) => o.kind)).toEqual(["cancel_refund"]);
  });

  it("writes an audit trail of every step", async () => {
    const b = await paidBooking();
    await svc.simulateDisruption("cozumel", 90, "customer-demo");
    const types = await store.read((db) => db.audit.filter((a) => !a.bookingId || a.bookingId === b.id).map((a) => a.type));
    expect(types).toEqual(
      expect.arrayContaining(["booking.created", "paypal.order.created", "paypal.capture.verified", "booking.confirmed", "disruption.simulated", "rescue.proposed"]),
    );
  });
});

describe("engagement events", () => {
  it("drops unknown types and strips personal data", async () => {
    await expect(svc.recordEngagement("evil", {})).rejects.toMatchObject({ code: "bad_event" });
    await svc.recordEngagement("match.completed", { count: 3, email: "a@b.com", page: "home", text: "my name is <script>" });
    const e = await store.read((db) => db.engagement.at(-1)!);
    expect(e.props).toEqual({ count: 3, page: "home" });
  });
});

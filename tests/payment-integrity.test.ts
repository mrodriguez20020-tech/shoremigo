import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakePayPal } from "./fake-paypal";

// Integrity under concurrency and failure: duplicate submissions, double clicks and expired holds.
// Uses the offline PayPal test double (see fake-paypal.ts); not evidence of live sandbox behavior.
process.env.PAYPAL_CLIENT_ID = "test-client";
process.env.PAYPAL_CLIENT_SECRET = "test-secret";

const store = await import("@/lib/server/store");
const svc = await import("@/lib/server/bookings");
const paypal = await import("@/lib/server/paypal");
const { POLICY } = await import("@/lib/domain/catalog");

let pp: ReturnType<typeof createFakePayPal>;
beforeEach(() => {
  store.__resetStoreForTests();
  paypal.__resetPayPalTokenForTests();
  pp = createFakePayPal();
  vi.stubGlobal("fetch", pp.fetchImpl);
  delete process.env.RESCUE_SKIP_OPERATOR_REVIEW;
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

const guest = { firstName: "Ana", lastName: "Rivera", email: "ana@example.com" };
async function paidBooking(excursionId = "coz-palancar-snorkel", guests = 2) {
  const b = await svc.createBooking({ excursionId, guests, ...guest });
  const order = await svc.startCheckout(b.id);
  return svc.completeCheckout(b.id, order.id);
}
async function disruptedAndReviewed() {
  const b = await paidBooking();
  await svc.simulateDisruption("cozumel", 90, "operator");
  const p = (await svc.openRescueFor(b.id))!;
  await svc.reviewRescue(p.id, "approved");
  return { b, p };
}

describe("checkout capture", () => {
  it("records exactly one payment when the same capture is submitted twice concurrently", async () => {
    const b = await svc.createBooking({ excursionId: "coz-palancar-snorkel", guests: 2, ...guest });
    const order = await svc.startCheckout(b.id);
    const results = await Promise.allSettled([svc.completeCheckout(b.id, order.id), svc.completeCheckout(b.id, order.id)]);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const saved = (await svc.getBooking(b.id))!;
    expect(saved.status).toBe("confirmed");
    expect(saved.payments.filter((p) => p.kind === "charge")).toHaveLength(1);
    expect(saved.paidCents).toBe(saved.totalCents);
  });

  it("refuses to capture an expired hold whose seats were resold, and moves no money", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-12T12:00:00Z"));
    // Punta Sur: capacity 12. Guest A holds 8 and lets the hold lapse; guest B then takes 8.
    const a = await svc.createBooking({ excursionId: "coz-punta-sur", guests: 8, ...guest });
    const orderA = await svc.startCheckout(a.id);
    vi.setSystemTime(new Date(Date.now() + (POLICY.holdMinutes + 1) * 60_000));
    const bk = await svc.createBooking({ excursionId: "coz-punta-sur", guests: 8, ...guest });
    const orderB = await svc.startCheckout(bk.id);
    await svc.completeCheckout(bk.id, orderB.id);
    await expect(svc.completeCheckout(a.id, orderA.id)).rejects.toMatchObject({ code: "sold_out" });
    expect(pp.calls.filter((c) => c.path === `/v2/checkout/orders/${orderA.id}/capture`)).toHaveLength(0);
    const confirmedSeats = await store.read((db) => db.bookings.filter((x) => x.excursionId === "coz-punta-sur" && x.status === "confirmed").reduce((n, x) => n + x.guests, 0));
    expect(confirmedSeats).toBeLessThanOrEqual(12);
  });

  it("still captures an expired hold when seats remain, renewing the hold", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-12T12:00:00Z"));
    const a = await svc.createBooking({ excursionId: "coz-punta-sur", guests: 2, ...guest });
    const order = await svc.startCheckout(a.id);
    vi.setSystemTime(new Date(Date.now() + (POLICY.holdMinutes + 1) * 60_000));
    const done = await svc.completeCheckout(a.id, order.id);
    expect(done.status).toBe("confirmed");
  });
});

describe("Trip Rescue approval", () => {
  it("refunds once when a cancellation is approved twice concurrently (double click)", async () => {
    const { b } = await disruptedAndReviewed();
    const results = await Promise.allSettled([svc.approveRescue(b.id, "opt-cancel", "customer"), svc.approveRescue(b.id, "opt-cancel", "customer")]);
    expect(results.filter((r) => r.status === "fulfilled").length).toBeGreaterThanOrEqual(1);
    const saved = (await svc.getBooking(b.id))!;
    expect(saved.payments.filter((p) => p.kind === "refund")).toHaveLength(1);
    expect(saved.paidCents).toBe(0);
    expect(saved.status).toBe("cancelled_refunded");
  });

  it("does not let two different options both resolve the same proposal", async () => {
    const { b } = await disruptedAndReviewed();
    const results = await Promise.allSettled([svc.approveRescue(b.id, "opt-cancel", "customer"), svc.approveRescue(b.id, "opt-coz-afternoon-reef", "customer")]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const saved = (await svc.getBooking(b.id))!;
    const refunded = saved.payments.filter((p) => p.kind === "refund").reduce((n, p) => n + p.amountCents, 0);
    expect(saved.paidCents).toBe(saved.payments.filter((p) => p.kind === "charge").reduce((n, p) => n + p.amountCents, 0) - refunded);
    expect(saved.paidCents).toBeGreaterThanOrEqual(0);
    expect(saved.status === "cancelled_refunded" ? saved.paidCents === 0 : saved.paidCents === 7900 * 2).toBe(true);
  });

  it("releases the claim when the PayPal refund fails, so the guest can try again", async () => {
    const { b } = await disruptedAndReviewed();
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) =>
      String(input).endsWith("/refund") ? new Response(JSON.stringify({ name: "INTERNAL_SERVER_ERROR" }), { status: 500 }) : pp.fetchImpl(input, init));
    await expect(svc.approveRescue(b.id, "opt-cancel", "customer")).rejects.toBeTruthy();
    vi.stubGlobal("fetch", pp.fetchImpl);
    const res = await svc.approveRescue(b.id, "opt-cancel", "customer");
    expect(res.kind).toBe("resolved");
  });

  it("records exactly one top-up when the same top-up capture is submitted twice", async () => {
    process.env.RESCUE_SKIP_OPERATOR_REVIEW = "true";
    const b = await paidBooking("coz-cacao", 2);
    await svc.simulateDisruption("cozumel", 180, "operator");
    const p = (await svc.openRescueFor(b.id))!;
    const pricier = p.options.find((o) => o.deltaCents > 0)!;
    const r = await svc.approveRescue(b.id, pricier.id, "customer");
    if (r.kind !== "payment_required") throw new Error("expected top-up");
    await Promise.allSettled([svc.completeRescueTopUp(b.id, r.orderId), svc.completeRescueTopUp(b.id, r.orderId)]);
    const saved = (await svc.getBooking(b.id))!;
    expect(saved.payments.filter((x) => x.purpose === "rescue top-up")).toHaveLength(1);
    expect(saved.paidCents).toBe(13000 + pricier.deltaCents);
  });
});

describe("store transactions", () => {
  it("roll back every change when the callback throws", async () => {
    await expect(store.tx((db) => { db.audit.push({ id: "x", at: "", actor: "system", type: "partial", detail: {} }); throw new Error("boom"); })).rejects.toThrow("boom");
    expect(await store.read((db) => db.audit.some((a) => a.type === "partial"))).toBe(false);
  });

  it("still audits a rejected capture even though the confirmation is refused", async () => {
    pp.opts.captureAmountOverride = "1.00";
    const b = await svc.createBooking({ excursionId: "coz-cacao", guests: 1, ...guest });
    const order = await svc.startCheckout(b.id);
    await expect(svc.completeCheckout(b.id, order.id)).rejects.toMatchObject({ code: "payment_unverified" });
    expect(await store.read((db) => db.audit.some((a) => a.type === "paypal.capture.rejected" && a.bookingId === b.id))).toBe(true);
    expect((await svc.getBooking(b.id))!.status).toBe("pending_payment");
  });
});

describe("PayPal webhooks (reconciliation only)", () => {
  const hdrs = new Headers({ "paypal-auth-algo": "SHA256withRSA", "paypal-cert-url": "https://api.sandbox.paypal.com/cert", "paypal-transmission-id": "t1", "paypal-transmission-sig": "sig", "paypal-transmission-time": "2026-11-12T12:00:00Z" });
  function withVerify(status: string) {
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) =>
      String(input).endsWith("/v1/notifications/verify-webhook-signature")
        ? new Response(JSON.stringify({ verification_status: status }), { status: 200 })
        : pp.fetchImpl(input, init));
  }
  beforeEach(() => { process.env.PAYPAL_WEBHOOK_ID = "WH-TEST"; });
  afterEach(() => { delete process.env.PAYPAL_WEBHOOK_ID; });

  it("rejects deliveries PayPal does not verify, or with missing headers", async () => {
    withVerify("FAILURE");
    expect(await paypal.verifyWebhookSignature(hdrs, { id: "e" })).toBe(false);
    withVerify("SUCCESS");
    expect(await paypal.verifyWebhookSignature(new Headers(), { id: "e" })).toBe(false);
    expect(await paypal.verifyWebhookSignature(hdrs, { id: "e" })).toBe(true);
  });

  it("reconciles a capture against PayPal, flags a dashboard refund as drift, and ignores duplicates", async () => {
    const b = await paidBooking();
    const captureId = b.payments[0].captureId!;
    const ok = await svc.reconcileWebhookEvent({ id: "WH-1", event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { id: captureId } });
    expect(ok).toMatchObject({ matched: true, drift: false });
    // Refund made outside the app (e.g. from the PayPal dashboard): booking is not rewritten, drift is audited.
    pp.captures.get(captureId)!.refunded = 500;
    const ev = { id: "WH-2", event_type: "PAYMENT.CAPTURE.REFUNDED", resource: { id: "REFX", links: [{ rel: "up", href: `https://api.sandbox.paypal.com/v2/payments/captures/${captureId}` }] } };
    expect(await svc.reconcileWebhookEvent(ev)).toMatchObject({ matched: true, drift: true, paypalStatus: "PARTIALLY_REFUNDED" });
    expect(await svc.reconcileWebhookEvent(ev)).toMatchObject({ handled: false, reason: "duplicate" });
    const saved = (await svc.getBooking(b.id))!;
    expect(saved.paidCents).toBe(b.paidCents);
    expect(await store.read((db) => db.audit.filter((a) => a.type === "paypal.webhook.drift").length)).toBe(1);
  });

  it("audits events for unknown captures without touching bookings", async () => {
    expect(await svc.reconcileWebhookEvent({ id: "WH-3", event_type: "PAYMENT.CAPTURE.DENIED", resource: { id: "NOPE" } })).toMatchObject({ matched: false });
    expect(await svc.reconcileWebhookEvent({ id: "WH-4", event_type: "CHECKOUT.ORDER.APPROVED", resource: { id: "x" } })).toMatchObject({ handled: false, reason: "ignored_type" });
  });
});

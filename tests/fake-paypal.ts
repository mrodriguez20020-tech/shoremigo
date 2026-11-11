/**
 * TEST DOUBLE ONLY. A tiny in-memory imitation of the PayPal REST endpoints
 * our client calls, used to unit-test request shape, verification and
 * idempotency logic offline. It is NOT evidence of a working sandbox
 * integration; that is verified manually against api-m.sandbox.paypal.com.
 */
interface FakeOrder {
  id: string;
  status: string;
  amount: string;
  customId: string;
  capture?: { id: string; status: string; amount: string };
}

export function createFakePayPal() {
  const orders = new Map<string, FakeOrder>();
  const captures = new Map<string, { id: string; status: string; amount: string; refunded: number }>();
  const byRequestId = new Map<string, unknown>();
  const calls: { method: string; path: string; requestId?: string; body?: unknown }[] = [];
  const opts = { declineNextCapture: false, captureAmountOverride: null as string | null, refundStatus: "COMPLETED", captureStatus: "COMPLETED" };
  let n = 0;

  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  const orderView = (o: FakeOrder) => ({
    id: o.id,
    status: o.status,
    purchase_units: [
      {
        reference_id: o.customId,
        custom_id: o.customId,
        amount: { currency_code: "USD", value: o.amount },
        ...(o.capture ? { payments: { captures: [{ id: o.capture.id, status: o.capture.status, amount: { currency_code: "USD", value: o.capture.amount }, custom_id: o.customId }] } } : {}),
      },
    ],
  });

  const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const requestId = headers["PayPal-Request-Id"];
    const body = init?.body && typeof init.body === "string" && init.body.startsWith("{") ? JSON.parse(init.body) : undefined;
    calls.push({ method, path: url.pathname, requestId, body });

    if (url.pathname === "/v1/oauth2/token") return json(200, { access_token: "fake-token", expires_in: 3600 });
    if (requestId && byRequestId.has(requestId)) return json(200, byRequestId.get(requestId));

    if (method === "POST" && url.pathname === "/v2/checkout/orders") {
      const id = `ORDER${++n}`;
      const pu = body.purchase_units[0];
      orders.set(id, { id, status: "CREATED", amount: pu.amount.value, customId: pu.custom_id });
      const out = orderView(orders.get(id)!);
      if (requestId) byRequestId.set(requestId, out);
      return json(201, out);
    }
    let m = /^\/v2\/checkout\/orders\/([^/]+)(\/capture)?$/.exec(url.pathname);
    if (m) {
      const o = orders.get(m[1]);
      if (!o) return json(404, { name: "RESOURCE_NOT_FOUND" });
      if (!m[2]) return json(200, orderView(o));
      if (o.capture) return json(422, { name: "UNPROCESSABLE_ENTITY", details: [{ issue: "ORDER_ALREADY_CAPTURED", description: "Order already captured." }] });
      if (opts.declineNextCapture) {
        opts.declineNextCapture = false;
        return json(422, { name: "UNPROCESSABLE_ENTITY", details: [{ issue: "INSTRUMENT_DECLINED", description: "The instrument presented was declined." }] });
      }
      const cap = { id: `CAP${++n}`, status: opts.captureStatus, amount: opts.captureAmountOverride ?? o.amount };
      o.capture = cap;
      o.status = opts.captureStatus === "COMPLETED" ? "COMPLETED" : "APPROVED";
      captures.set(cap.id, { ...cap, refunded: 0 });
      const out = orderView(o);
      if (requestId) byRequestId.set(requestId, out);
      return json(201, out);
    }
    m = /^\/v2\/payments\/captures\/([^/]+)(\/refund)?$/.exec(url.pathname);
    if (m) {
      const c = captures.get(m[1]);
      if (!c) return json(404, { name: "RESOURCE_NOT_FOUND" });
      if (!m[2]) return json(200, { id: c.id, status: c.refunded > 0 ? "PARTIALLY_REFUNDED" : c.status, amount: { currency_code: "USD", value: c.amount } });
      const out = { id: `REF${++n}`, status: opts.refundStatus, amount: body.amount };
      c.refunded += Math.round(Number(body.amount.value) * 100);
      if (requestId) byRequestId.set(requestId, out);
      return json(201, out);
    }
    return json(404, { name: "NOT_FOUND" });
  };

  return { fetchImpl: fetchImpl as typeof fetch, orders, captures, calls, opts };
}

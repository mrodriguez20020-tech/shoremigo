import "server-only";
import { centsToPaypal, paypalToCents } from "@/lib/domain/time";

/**
 * Minimal PayPal REST client (Orders v2 + Payments v2), SANDBOX ONLY.
 * Secrets stay server-side; only NEXT_PUBLIC_PAYPAL_CLIENT_ID reaches the browser.
 */
const BASE = "https://api-m.sandbox.paypal.com";

export class PayPalNotConfigured extends Error {
  constructor() {
    super("PayPal sandbox is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.");
  }
}

export class PayPalError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
  }
}

export function paypalConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

let token: { value: string; exp: number } | null = null;

async function accessToken(fetchImpl: typeof fetch = fetch): Promise<string> {
  if (!paypalConfigured()) throw new PayPalNotConfigured();
  if (token && token.exp > Date.now() + 60_000) return token.value;
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const res = await fetchImpl(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new PayPalError("PayPal auth failed", res.status, body);
  token = { value: body.access_token, exp: Date.now() + body.expires_in * 1000 };
  return token.value;
}

async function call<T>(method: string, p: string, body?: unknown, requestId?: string, fetchImpl: typeof fetch = fetch): Promise<T> {
  const t = await accessToken(fetchImpl);
  const res = await fetchImpl(`${BASE}${p}`, {
    method,
    headers: {
      Authorization: `Bearer ${t}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new PayPalError(`PayPal ${method} ${p} failed (${res.status})`, res.status, json);
  return json as T;
}

export interface PayPalOrder {
  id: string;
  status: string;
  purchase_units: {
    reference_id?: string;
    custom_id?: string;
    amount: { currency_code: string; value: string };
    payments?: { captures?: { id: string; status: string; amount: { currency_code: string; value: string }; custom_id?: string }[] };
  }[];
}

export async function createOrder(args: {
  amountCents: number;
  customId: string;
  description: string;
  requestId: string;
  fetchImpl?: typeof fetch;
}) {
  return call<PayPalOrder>(
    "POST",
    "/v2/checkout/orders",
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: args.customId,
          custom_id: args.customId,
          description: args.description.slice(0, 127),
          amount: { currency_code: "USD", value: centsToPaypal(args.amountCents) },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: { brand_name: "ShoreMigo (sandbox demo)", shipping_preference: "NO_SHIPPING", user_action: "PAY_NOW" },
        },
      },
    },
    args.requestId,
    args.fetchImpl,
  );
}

export async function getOrder(orderId: string, fetchImpl?: typeof fetch) {
  return call<PayPalOrder>("GET", `/v2/checkout/orders/${encodeURIComponent(orderId)}`, undefined, undefined, fetchImpl);
}

export async function captureOrder(orderId: string, requestId: string, fetchImpl?: typeof fetch) {
  return call<PayPalOrder>("POST", `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {}, requestId, fetchImpl);
}

export interface PayPalRefund {
  id: string;
  status: string;
  amount?: { currency_code: string; value: string };
}

export async function refundCapture(captureId: string, amountCents: number, requestId: string, fetchImpl?: typeof fetch) {
  return call<PayPalRefund>(
    "POST",
    `/v2/payments/captures/${encodeURIComponent(captureId)}/refund`,
    { amount: { currency_code: "USD", value: centsToPaypal(amountCents) } },
    requestId,
    fetchImpl,
  );
}

export async function getCapture(captureId: string, fetchImpl?: typeof fetch) {
  return call<{ id: string; status: string; amount: { value: string; currency_code: string } }>(
    "GET",
    `/v2/payments/captures/${encodeURIComponent(captureId)}`,
    undefined,
    undefined,
    fetchImpl,
  );
}

/**
 * Verifies a captured order matches exactly what our server expected. This is
 * the ONLY path by which a booking can become confirmed.
 */
export function verifyCapturedOrder(order: PayPalOrder, expected: { customId: string; amountCents: number }) {
  const unit = order.purchase_units?.[0];
  const cap = unit?.payments?.captures?.[0];
  const problems: string[] = [];
  if (order.status !== "COMPLETED") problems.push(`order status is ${order.status}`);
  if (!cap) problems.push("no capture present");
  if (cap && cap.status !== "COMPLETED") problems.push(`capture status is ${cap.status}`);
  if (unit?.custom_id !== expected.customId && cap?.custom_id !== expected.customId) problems.push("custom_id mismatch");
  if (cap && cap.amount.currency_code !== "USD") problems.push("currency mismatch");
  if (cap && paypalToCents(cap.amount.value) !== expected.amountCents) problems.push("amount mismatch");
  return { ok: problems.length === 0, problems, capture: cap };
}

export function __resetPayPalTokenForTests() {
  token = null;
}

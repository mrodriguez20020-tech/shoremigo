import { NextResponse } from "next/server";
import { reconcileWebhookEvent } from "@/lib/server/bookings";
import { paypalWebhookConfigured, verifyWebhookSignature } from "@/lib/server/paypal";

export const dynamic = "force-dynamic";

/**
 * PayPal sandbox webhook receiver. Disabled (503) until PAYPAL_WEBHOOK_ID is set for a webhook
 * registered in the PayPal developer dashboard. Unverified deliveries are rejected and change nothing.
 */
export async function POST(req: Request) {
  if (!paypalWebhookConfigured()) return NextResponse.json({ error: "Webhooks are not configured." }, { status: 503 });
  const raw = await req.text();
  if (raw.length > 64_000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  let event: unknown;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    if (!(await verifyWebhookSignature(req.headers, event))) return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
    const result = await reconcileWebhookEvent(event as Parameters<typeof reconcileWebhookEvent>[0]);
    return NextResponse.json(result);
  } catch (e) {
    console.error("PayPal webhook error", e instanceof Error ? e.message : e);
    // 500 lets PayPal retry; reconciliation is idempotent by event id.
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

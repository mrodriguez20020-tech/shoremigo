import "server-only";
import { NextResponse } from "next/server";
import { DomainError } from "./bookings";
import { PayPalError, PayPalNotConfigured } from "./paypal";

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(e: unknown) {
  if (e instanceof DomainError) return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
  if (e instanceof PayPalNotConfigured) return NextResponse.json({ error: e.message, code: "paypal_not_configured" }, { status: 503 });
  if (e instanceof PayPalError) {
    console.error("PayPal error", e.status, JSON.stringify(e.body).slice(0, 800));
    const issue = (e.body as { details?: { issue?: string; description?: string }[] })?.details?.[0];
    return NextResponse.json(
      { error: issue?.description ?? "PayPal rejected the request.", code: issue?.issue ?? "paypal_error", paypalStatus: e.status },
      { status: 502 },
    );
  }
  console.error(e);
  return NextResponse.json({ error: "Something went wrong on our side.", code: "internal" }, { status: 500 });
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<Partial<T>> {
  try {
    return (await req.json()) as Partial<T>;
  } catch {
    return {};
  }
}

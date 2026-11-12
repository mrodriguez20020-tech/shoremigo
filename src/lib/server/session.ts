import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Booking verification session: a customer proves they own a booking with
 * reference + last name, and receives an HMAC-signed, httpOnly cookie scoped to
 * that booking. Sensitive booking/payment data requires this cookie.
 */
const COOKIE = "sm_trip";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET (16+ chars) is required in production");
  return "dev-only-insecure-secret-change-me";
}

export function sign(bookingId: string, issuedAt = Date.now()): string {
  const payload = `${bookingId}.${issuedAt}`;
  const mac = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function verify(token: string | undefined, now = Date.now()): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [id, iat, mac] = parts;
  const expected = createHmac("sha256", secret()).update(`${id}.${iat}`).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (now - Number(iat) > MAX_AGE * 1000) return null;
  return id;
}

export async function setTripSession(bookingId: string) {
  (await cookies()).set(COOKIE, sign(bookingId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getVerifiedBookingId(): Promise<string | null> {
  return verify((await cookies()).get(COOKIE)?.value);
}

export async function clearTripSession() {
  (await cookies()).delete(COOKIE);
}

/** Operator access: if OPERATOR_PASSCODE is set, require header/cookie match. */
export async function isOperator(req?: Request): Promise<boolean> {
  const code = process.env.OPERATOR_PASSCODE;
  if (!code) return !process.env.VERCEL && process.env.NODE_ENV !== "production"; // Only local development may use unprotected demo mode.
  const header = req?.headers.get("x-operator-passcode");
  const cookie = (await cookies()).get("sm_op")?.value;
  return passcodeMatches(header) || safeEqual(cookie, operatorCookieValue());
}

/** Constant-time comparison of two strings (hashing first equalizes lengths). */
function safeEqual(a: string | null | undefined, b: string) {
  if (!a) return false;
  const h = (v: string) => createHmac("sha256", "cmp").update(v).digest();
  return timingSafeEqual(h(a), h(b));
}

export function passcodeMatches(candidate: string | null | undefined) {
  const code = process.env.OPERATOR_PASSCODE;
  return Boolean(code) && safeEqual(candidate, code!);
}

// Per-instance login throttle: 5 failures per 10 minutes per client address.
const failures = new Map<string, number[]>();
const WINDOW_MS = 10 * 60_000;
export function loginThrottled(key: string, now = Date.now()) {
  const recent = (failures.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  failures.set(key, recent);
  return recent.length >= 5;
}
export function recordLoginFailure(key: string, now = Date.now()) {
  failures.set(key, [...(failures.get(key) ?? []), now]);
  if (failures.size > 10_000) failures.clear();
}

export function operatorCookieValue() {
  return createHmac("sha256", secret()).update(process.env.OPERATOR_PASSCODE ?? "").digest("base64url");
}

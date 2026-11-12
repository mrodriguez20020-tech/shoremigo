import QRCode from "qrcode";
import { getBooking } from "@/lib/server/bookings";
import { fail, ok } from "@/lib/server/http";
import { getVerifiedBookingId, passToken } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Verified guest only: their Shore Pass verification link and its QR code (SVG). */
export async function GET(req: Request) {
  try {
    const id = await getVerifiedBookingId();
    if (!id) return ok({ error: "Verify your booking first." }, { status: 401 });
    const b = await getBooking(id);
    if (!b || (b.status !== "confirmed" && b.status !== "rebooked")) return ok({ error: "No active Shore Pass for this booking." }, { status: 409 });
    const origin = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "") || requestOrigin(req);
    const url = `${origin}/pass/${encodeURIComponent(passToken(b.id))}`;
    const svg = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#1b1530", light: "#00000000" } });
    return ok({ url, svg });
  } catch (e) {
    return fail(e);
  }
}

/** The host the guest actually used (proxy-aware). PUBLIC_BASE_URL, when set, always wins. */
function requestOrigin(req: Request) {
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0].trim();
  if (!/^[A-Za-z0-9.-]+(:\d+)?$/.test(host)) return new URL(req.url).origin;
  const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
  const proto = (req.headers.get("x-forwarded-proto") ?? (local ? "http" : "https")).split(",")[0].trim();
  return `${proto === "http" ? "http" : "https"}://${host}`;
}

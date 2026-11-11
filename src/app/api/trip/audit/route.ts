import { fail, ok } from "@/lib/server/http";
import { getVerifiedBookingId } from "@/lib/server/session";
import { read } from "@/lib/server/store";

export const dynamic = "force-dynamic";

/**
 * Server-side audit events for the VERIFIED booking only (Live proof drawer).
 * Same session gate as /api/trip: no session → no data.
 */
export async function GET() {
  try {
    const id = await getVerifiedBookingId();
    if (!id) return ok({ verified: false, events: [] });
    const events = await read((db) =>
      db.audit
        .filter((a) => a.bookingId === id)
        .slice(-40)
        .reverse()
        .map((a) => ({ at: a.at, actor: a.actor, type: a.type, detail: a.detail })),
    );
    return ok({ verified: true, events });
  } catch (e) {
    return fail(e);
  }
}

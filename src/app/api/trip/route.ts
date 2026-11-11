import { activeDisruption, getBooking, openRescueFor } from "@/lib/server/bookings";
import { fail, ok } from "@/lib/server/http";
import { publicBooking } from "@/lib/server/dto";
import { clearTripSession, getVerifiedBookingId } from "@/lib/server/session";
import { read } from "@/lib/server/store";
import { getExcursion } from "@/lib/domain/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const id = await getVerifiedBookingId();
    if (!id) return ok({ verified: false });
    const b = await getBooking(id);
    if (!b) return ok({ verified: false });
    const portId = getExcursion(b.excursionId)!.portId;
    const [rescue, disruption] = await Promise.all([openRescueFor(id), read((db) => activeDisruption(db, portId) ?? null)]);
    return ok({ verified: true, booking: publicBooking(b), rescue, disruption });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE() {
  await clearTripSession();
  return ok({ verified: false });
}

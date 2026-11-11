import { findBookingByRef } from "@/lib/server/bookings";
import { body, fail, ok } from "@/lib/server/http";
import { setTripSession } from "@/lib/server/session";

export async function POST(req: Request) {
  try {
    const { ref, lastName } = await body<{ ref: string; lastName: string }>(req);
    if (!ref || !lastName) return ok({ error: "Booking reference and last name are required." }, { status: 400 });
    const b = await findBookingByRef(String(ref), String(lastName));
    // Same response for a wrong ref or a wrong name, so we don't reveal which part matched.
    if (!b) return ok({ error: "We couldn't find a booking with those details." }, { status: 404 });
    await setTripSession(b.id);
    return ok({ verified: true });
  } catch (e) {
    return fail(e);
  }
}

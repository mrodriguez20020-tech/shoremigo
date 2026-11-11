import { getExcursion } from "@/lib/domain/catalog";
import { getBooking, simulateDisruption } from "@/lib/server/bookings";
import { body, fail, ok } from "@/lib/server/http";
import { getVerifiedBookingId } from "@/lib/server/session";

/** DEMO ONLY: a verified customer may simulate a delay at their own booking's port. */
export async function POST(req: Request) {
  try {
    const id = await getVerifiedBookingId();
    if (!id) return ok({ error: "Verify your booking first." }, { status: 401 });
    const b = await getBooking(id);
    if (!b) return ok({ error: "Booking not found" }, { status: 404 });
    const { delayMin } = await body<{ delayMin: number }>(req);
    const r = await simulateDisruption(getExcursion(b.excursionId)!.portId, Number(delayMin ?? 90), "customer-demo");
    return ok({ simulated: true, ...r });
  } catch (e) {
    return fail(e);
  }
}

import { completeCheckout } from "@/lib/server/bookings";
import { body, fail, ok } from "@/lib/server/http";
import { publicBooking } from "@/lib/server/dto";
import { setTripSession } from "@/lib/server/session";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { orderId } = await body<{ orderId: string }>(req);
    if (!orderId) return ok({ error: "orderId required" }, { status: 400 });
    const b = await completeCheckout((await params).id, String(orderId));
    // The paying customer is now verified for this booking.
    await setTripSession(b.id);
    return ok({ booking: publicBooking(b), verified: true });
  } catch (e) {
    return fail(e);
  }
}

import { completeRescueTopUp } from "@/lib/server/bookings";
import { body, fail, ok } from "@/lib/server/http";
import { publicBooking } from "@/lib/server/dto";
import { getVerifiedBookingId } from "@/lib/server/session";

export async function POST(req: Request) {
  try {
    const id = await getVerifiedBookingId();
    if (!id) return ok({ error: "Verify your booking first." }, { status: 401 });
    const { orderId } = await body<{ orderId: string }>(req);
    const b = await completeRescueTopUp(id, String(orderId));
    return ok({ booking: publicBooking(b) });
  } catch (e) {
    return fail(e);
  }
}

import { createBooking, type CreateBookingInput } from "@/lib/server/bookings";
import { body, fail, ok } from "@/lib/server/http";
import { publicBooking } from "@/lib/server/dto";

export async function POST(req: Request) {
  try {
    const b = await createBooking(await body<CreateBookingInput>(req));
    return ok({ booking: publicBooking(b) }, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}

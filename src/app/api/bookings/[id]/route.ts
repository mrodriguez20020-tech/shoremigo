import { getBooking } from "@/lib/server/bookings";
import { fail, ok } from "@/lib/server/http";
import { publicBooking } from "@/lib/server/dto";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const b = await getBooking((await params).id);
    if (!b) return ok({ error: "Not found" }, { status: 404 });
    return ok({ booking: publicBooking(b) });
  } catch (e) {
    return fail(e);
  }
}

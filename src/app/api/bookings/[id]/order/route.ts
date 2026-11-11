import { startCheckout } from "@/lib/server/bookings";
import { fail, ok } from "@/lib/server/http";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const order = await startCheckout((await params).id);
    return ok({ orderId: order.id, status: order.status });
  } catch (e) {
    return fail(e);
  }
}

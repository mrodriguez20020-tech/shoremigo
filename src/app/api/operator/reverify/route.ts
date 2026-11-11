import { reverifyPayments } from "@/lib/server/bookings";
import { body, fail, ok } from "@/lib/server/http";
import { isOperator } from "@/lib/server/session";

export async function POST(req: Request) {
  try {
    if (!(await isOperator(req))) return ok({ error: "Operator access required" }, { status: 401 });
    const { bookingId } = await body<{ bookingId: string }>(req);
    return ok({ results: await reverifyPayments(String(bookingId)) });
  } catch (e) {
    return fail(e);
  }
}

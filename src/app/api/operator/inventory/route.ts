import { updateInventory } from "@/lib/server/bookings";
import { body, fail, ok } from "@/lib/server/http";
import { isOperator } from "@/lib/server/session";

/** Operator-only: change an excursion's capacity or open/close sales. */
export async function POST(req: Request) {
  try {
    if (!(await isOperator(req))) return ok({ error: "Operator access required" }, { status: 401 });
    const input = await body<{ excursionId?: string; capacity?: unknown; open?: unknown }>(req);
    return ok({ row: await updateInventory(input) });
  } catch (e) {
    return fail(e);
  }
}

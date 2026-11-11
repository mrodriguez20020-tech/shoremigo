import { inventoryRows } from "@/lib/server/bookings";
import { fail, ok } from "@/lib/server/http";
import { isOperator } from "@/lib/server/session";
import { read } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    if (!(await isOperator(req))) return ok({ error: "Operator access required" }, { status: 401 });
    const data = await read((db) => {
      const counts: Record<string, number> = {};
      for (const e of db.engagement) counts[e.type] = (counts[e.type] ?? 0) + 1;
      return {
        bookings: [...db.bookings].reverse(),
        rescues: [...db.rescues].reverse(),
        disruptions: db.disruptions,
        audit: [...db.audit].reverse().slice(0, 300),
        engagement: counts,
        inventory: inventoryRows(db),
      };
    });
    return ok({ ...data, protected: Boolean(process.env.OPERATOR_PASSCODE) });
  } catch (e) {
    return fail(e);
  }
}

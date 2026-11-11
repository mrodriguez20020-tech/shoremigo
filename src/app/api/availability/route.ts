import { availabilitySnapshot } from "@/lib/server/bookings";
import { fail, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok({ items: await availabilitySnapshot() });
  } catch (e) {
    return fail(e);
  }
}

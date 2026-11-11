import { approveRescue } from "@/lib/server/bookings";
import { body, fail, ok } from "@/lib/server/http";
import { publicBooking } from "@/lib/server/dto";
import { getVerifiedBookingId } from "@/lib/server/session";

export async function POST(req: Request) {
  try {
    const id = await getVerifiedBookingId();
    if (!id) return ok({ error: "Verify your booking first." }, { status: 401 });
    const { optionId, confirm } = await body<{ optionId: string; confirm: boolean }>(req);
    if (confirm !== true) return ok({ error: "Explicit confirmation is required." }, { status: 400 });
    const r = await approveRescue(id, String(optionId), "customer");
    if (r.kind === "payment_required") return ok(r);
    return ok({
      kind: r.kind,
      booking: publicBooking(r.booking),
      refunds: r.refunds.map((x) => ({ amountCents: x.amountCents, status: x.status })),
      refundsCompleted: r.refundsCompleted,
    });
  } catch (e) {
    return fail(e);
  }
}

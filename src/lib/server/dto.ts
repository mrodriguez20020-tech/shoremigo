import "server-only";
import { getExcursion, getPort } from "@/lib/domain/catalog";
import type { Booking } from "@/lib/domain/types";

/** Customer-facing booking shape: no email, payment IDs truncated. */
export function publicBooking(b: Booking) {
  const ex = getExcursion(b.excursionId)!;
  return {
    id: b.id,
    ref: b.ref,
    status: b.status,
    firstName: b.firstName,
    guests: b.guests,
    excursionId: b.excursionId,
    originalExcursionId: b.originalExcursionId,
    excursionTitle: ex.title,
    portId: ex.portId,
    portName: getPort(ex.portId)!.name,
    unitPriceCents: b.unitPriceCents,
    totalCents: b.totalCents,
    paidCents: b.paidCents,
    payments: b.payments.map((p) => ({
      kind: p.kind,
      amountCents: p.amountCents,
      status: p.status,
      purpose: p.purpose,
      verifiedAt: p.verifiedAt,
      ref: (p.refundId ?? p.captureId ?? "").slice(-6),
    })),
    updatedAt: b.updatedAt,
  };
}
export type PublicBooking = ReturnType<typeof publicBooking>;

import "server-only";
import { MEETING_POINTS, POLICY, getExcursion, getPort } from "@/lib/domain/catalog";
import { checkFeasibility } from "@/lib/domain/feasibility";
import { fmtMin } from "@/lib/domain/time";
import { activeDisruption, getBooking } from "./bookings";
import { verifyPassToken } from "./session";
import { read } from "./store";

export type PassValidity = "valid" | "under_review" | "not_valid" | "unknown";
export type PassView =
  | { validity: "unknown" }
  | {
      validity: Exclude<PassValidity, "unknown">;
      ref: string;
      firstName: string;
      guests: number;
      status: string;
      excursion: string;
      port: string;
      date: string;
      departs: string;
      backAtPier: string;
      meetingPoint: string;
      checkedAt: string;
    };

/** Minimal, privacy-preserving verification view: first name only, no email, last name or payment ids. */
export async function verifyPass(token: string | undefined | null): Promise<PassView> {
  const id = verifyPassToken(token);
  if (!id) return { validity: "unknown" };
  const b = await getBooking(id);
  if (!b) return { validity: "unknown" };
  const ex = getExcursion(b.excursionId)!;
  const port = getPort(ex.portId)!;
  const d = await read((db) => activeDisruption(db, port.id) ?? null);
  const f = checkFeasibility(port, ex, POLICY, { delayMin: d?.delayMin ?? 0, allAboardExtensionMin: d?.allAboardExtensionMin });
  const validity: Exclude<PassValidity, "unknown"> =
    b.status === "confirmed" || b.status === "rebooked" ? "valid" : b.status === "disrupted" ? "under_review" : "not_valid";
  return {
    validity,
    ref: b.ref,
    firstName: b.firstName,
    guests: b.guests,
    status: b.status,
    excursion: ex.title,
    port: `${port.name}, ${port.country}`,
    date: port.date,
    departs: fmtMin(f.timeline.departs),
    backAtPier: fmtMin(f.timeline.backAtPier),
    meetingPoint: MEETING_POINTS[port.id],
    checkedAt: new Date().toISOString(),
  };
}

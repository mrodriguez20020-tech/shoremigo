import type { Excursion, Feasibility, Policy, PortCall } from "./types";
import { fmtMin, toMin } from "./time";

export interface DelayInput {
  delayMin: number;
  allAboardExtensionMin?: number;
}

/**
 * Deterministic itinerary feasibility check.
 *
 *   ready  = arrive + delay + disembark (+ tender extra) + transfer
 *   departs = fixed start, or max(start, ready) for flexible tours
 *   back   = departs + duration + return transfer
 *   must satisfy: ready <= departs  and  back <= allAboard(+ext) - buffer
 */
export function checkFeasibility(
  port: PortCall,
  ex: Excursion,
  policy: Policy,
  delay: DelayInput = { delayMin: 0 },
): Feasibility {
  if (ex.portId !== port.id) throw new Error(`Excursion ${ex.id} is not in port ${port.id}`);
  if (!Number.isFinite(delay.delayMin) || delay.delayMin < 0) throw new Error("delayMin must be >= 0");

  const reasons: string[] = [];
  const shipArrive = toMin(port.arrive) + delay.delayMin;
  const allAboard = toMin(port.allAboard) + (delay.allAboardExtensionMin ?? 0);
  const disembark = policy.disembarkMin + (port.tender ? policy.tenderExtraMin : 0);
  const readyAtMeetingPoint = shipArrive + disembark + ex.transferMin;
  const latestBack = allAboard - policy.returnBufferMin;

  let departs: number;
  let startOk = true;
  if (ex.startMode === "fixed") {
    departs = toMin(ex.start);
    if (readyAtMeetingPoint > departs) {
      startOk = false;
      reasons.push(
        `You'd reach the meeting point at ${fmtMin(readyAtMeetingPoint)}, but the tour departs at ${fmtMin(departs)}.`,
      );
    }
  } else {
    const earliest = toMin(ex.start);
    const latest = toMin(ex.latestStart ?? ex.start);
    departs = Math.max(earliest, readyAtMeetingPoint);
    if (departs > latest) {
      startOk = false;
      reasons.push(`The last departure is ${fmtMin(latest)}; you'd be ready at ${fmtMin(readyAtMeetingPoint)}.`);
    }
  }

  const ends = departs + ex.durationMin;
  const backAtPier = ends + ex.returnTransferMin;
  const returnSlack = latestBack - backAtPier;
  const startSlack = departs - readyAtMeetingPoint;
  const slackMin = Math.min(returnSlack, ex.startMode === "fixed" ? startSlack : returnSlack);

  if (returnSlack < 0) {
    reasons.push(
      `You'd be back at the pier at ${fmtMin(backAtPier)}; our safety cut-off is ${fmtMin(latestBack)} (${policy.returnBufferMin} min before all-aboard).`,
    );
  }

  let status: Feasibility["status"];
  if (!startOk || returnSlack < 0) status = "infeasible";
  else if (slackMin < policy.tightSlackMin) {
    status = "tight";
    reasons.push(`Only ${slackMin} minutes of margin. It works, but there's little room for surprises.`);
  } else {
    status = "ok";
    reasons.push(`${slackMin} minutes of margin before the safety cut-off.`);
  }

  return {
    status,
    slackMin,
    reasons,
    timeline: { shipArrive, readyAtMeetingPoint, departs, ends, backAtPier, latestBack, allAboard },
  };
}

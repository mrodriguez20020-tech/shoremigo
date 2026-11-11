import type { Booking, Excursion, Policy, PortCall, RescueOption } from "./types";
import { checkFeasibility, type DelayInput } from "./feasibility";

export interface RescueContext {
  booking: Booking;
  port: PortCall;
  original: Excursion;
  candidates: Excursion[]; // same-port excursions
  seatsLeft: (excursionId: string) => number;
  policy: Policy;
  delay: DelayInput;
}

/**
 * Deterministic rescue planner. Ranks feasible same-port alternatives:
 *   1. same category as the original
 *   2. more schedule margin
 *   3. closest price
 * A full refund is always offered as the final option.
 */
export function planRescue(ctx: RescueContext): RescueOption[] {
  const { booking, port, original, candidates, seatsLeft, policy, delay } = ctx;
  const scored = candidates
    .filter((c) => c.id !== original.id && c.portId === port.id)
    .map((c) => ({ c, f: checkFeasibility(port, c, policy, delay) }))
    .filter(({ c, f }) => f.status !== "infeasible" && seatsLeft(c.id) >= booking.guests)
    .map(({ c, f }) => {
      const newTotal = c.priceCents * booking.guests;
      const score =
        (c.category === original.category ? 1000 : 0) +
        Math.min(f.slackMin, 240) -
        Math.abs(c.priceCents - original.priceCents) / 100;
      return { c, f, newTotal, score };
    })
    .sort((a, b) => b.score - a.score || a.c.id.localeCompare(b.c.id))
    .slice(0, 3);

  const options: RescueOption[] = scored.map(({ c, f, newTotal }, i) => {
    const delta = newTotal - booking.paidCents;
    const why: string[] = [];
    if (c.category === original.category) why.push(`same kind of experience as ${original.title}`);
    why.push(f.status === "ok" ? `${f.slackMin} min of margin` : `fits, with ${f.slackMin} min of margin`);
    if (delta < 0) why.push(`refund of the difference`);
    if (delta > 0) why.push(`small top-up`);
    return {
      id: `opt-${c.id}`,
      kind: "switch",
      excursionId: c.id,
      feasibility: f,
      newTotalCents: newTotal,
      deltaCents: delta,
      rank: i + 1,
      why: why.join(" · "),
    };
  });

  options.push({
    id: "opt-cancel",
    kind: "cancel_refund",
    newTotalCents: 0,
    deltaCents: -booking.paidCents,
    rank: options.length + 1,
    why: "Cancel and refund everything you paid to your original PayPal payment.",
  });
  return options;
}

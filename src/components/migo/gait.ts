/** Two supplied whole-body poses: contact holds and eased recovery, not a limb rig. */
export const STRIDE_MS = 520;
export const ANTICIPATION_MS = 180;
export const CONTACT_FRACTION = 0.7;
export interface GaitSample {
  offset: number;
  frame: 0 | 1;
  contact: boolean;
  step: number;
  phase: "anticipation" | "recovery" | "contact";
}
export function gaitAt(elapsed: number, size = 124): GaitSample {
  if (elapsed < ANTICIPATION_MS)
    return {
      offset: 0,
      frame: 0,
      contact: false,
      step: -1,
      phase: "anticipation",
    };
  const t = elapsed - ANTICIPATION_MS;
  const step = Math.floor(t / STRIDE_MS);
  const phase = (t % STRIDE_MS) / STRIDE_MS;
  const p = Math.min(1, phase / CONTACT_FRACTION);
  const ease = p * p * (3 - 2 * p);
  // Small strides fit the approved art; no independent boot or facial deformation.
  return {
    offset: (step + ease) * size * 0.085,
    frame: (step % 2) as 0 | 1,
    contact: phase >= CONTACT_FRACTION,
    step,
    phase: phase >= CONTACT_FRACTION ? "contact" : "recovery",
  };
}
export type FootSurface = "deck" | "cabin" | "sand" | "underwater";
export function surfaceAt(path: string, cabin = false): FootSurface {
  if (path === "/ships") return cabin ? "cabin" : "deck";
  if (path.startsWith("/excursions")) return "sand";
  return "deck";
}

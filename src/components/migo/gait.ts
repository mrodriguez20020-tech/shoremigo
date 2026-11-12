/** Two supplied whole-body poses: contact holds and eased recovery, not a limb rig. */
export const STRIDE_MS = 460;
export const ANTICIPATION_MS = 200;
export const CONTACT_FRACTION = 0.65;
export interface GaitSample {
  offset: number;
  frame: 0 | 1;
  contact: boolean;
  step: number;
  phase: "anticipation" | "recovery" | "contact";
}
export function gaitAt(elapsed: number, size = 124, firstFoot: 0 | 1 = 0): GaitSample {
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
    frame: ((step + firstFoot) % 2) as 0 | 1,
    contact: phase >= CONTACT_FRACTION,
    step,
    phase: phase >= CONTACT_FRACTION ? "contact" : "recovery",
  };
}
export type FootSurface = "deck" | "cabin" | "sand" | "underwater";
export function surfaceAt(path: string, cabin = false, override?: string): FootSurface {
  if (override === "underwater" || override === "deck" || override === "cabin" || override === "sand") return override;
  if (path === "/ships") return cabin ? "cabin" : "deck";
  if (path.startsWith("/excursions")) return "sand";
  return "deck";
}

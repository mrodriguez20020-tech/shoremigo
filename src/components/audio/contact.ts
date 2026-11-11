import type { FootSurface } from "@/components/migo/gait";

export interface ContactPolicy {
  enabled: boolean;
  character: boolean;
  footsteps: boolean;
  volume: number;
  reduced: boolean;
  hidden: boolean;
  checkout: boolean;
  docked: boolean;
}
export function canSoundContact(p: ContactPolicy, surface: FootSurface) {
  return (
    p.enabled &&
    p.character &&
    p.footsteps &&
    p.volume > 0 &&
    !p.reduced &&
    !p.hidden &&
    !p.checkout &&
    !p.docked &&
    surface !== "underwater"
  );
}

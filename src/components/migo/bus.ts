import type { SceneId } from "@/lib/domain/types";

/**
 * Migo event bus. Application code emits *facts* ("payment verified",
 * "assistant thinking"); the Migo controller decides how he reacts.
 * Renderers (2.5D sprite today, rigged GLB later) only consume state.
 */
export type MigoEvent =
  | { type: "app:arrived" }
  | { type: "excursion:selected"; excursionId: string }
  | { type: "match:completed"; count: number }
  | { type: "concierge:opened" }
  | { type: "concierge:closed" }
  | { type: "concierge:typing" }
  | { type: "concierge:thinking" }
  | { type: "concierge:replied"; mood: "speaking" | "excited" | "concerned" }
  | { type: "concierge:error" }
  | { type: "checkout:entered" }
  | { type: "checkout:left" }
  | { type: "form:focus" }
  | { type: "form:blur" }
  | { type: "dock:request" }
  | { type: "dock:release" }
  /** Emit ONLY after the server confirmed a PayPal capture as verified. */
  | { type: "booking:verified"; ref: string }
  | { type: "disruption:detected"; delayMin: number }
  | { type: "rescue:guiding" }
  | { type: "rescue:resolved" }
  | { type: "scene:changed"; scene: SceneId }
  | { type: "user:poke" }
  /** A contextual, dismissible suggestion bubble. Shown at most once per key, never in checkout. */
  | { type: "suggest"; key: string; text: string; prompt?: string; href?: string; cta?: string };

type Listener = (e: MigoEvent) => void;
const listeners = new Set<Listener>();

export const migo = {
  emit(e: MigoEvent) {
    // Deliver after the current React commit: child effects run before parent
    // effects, so a page emitting on mount would otherwise beat the providers'
    // subscriptions on a direct page load. Also keeps emits out of render.
    queueMicrotask(() => listeners.forEach((l) => l(e)));
  },
  on(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  listenerCount: () => listeners.size,
};

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __migo: typeof migo }).__migo = migo;
}

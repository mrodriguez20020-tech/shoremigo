"use client";

import { useEffect } from "react";
import { migo } from "@/components/migo/bus";

/** Migo reacts to the selected excursion and offers one contextual, grounded tip. */
export function ExcursionMigo({ excursionId, title, feasible }: { excursionId: string; title: string; feasible: boolean }) {
  useEffect(() => {
    const t = setTimeout(() => {
      if (feasible) migo.emit({ type: "excursion:selected", excursionId });
      else migo.emit({ type: "disruption:detected", delayMin: 0 });
      migo.emit({
        type: "suggest",
        key: `ex-${excursionId}`,
        text: feasible
          ? `${title}, great pick! Want me to walk you through the timing or answer questions before you book?`
          : `Heads up: ${title} doesn't fit the ship's schedule right now. Want me to find something similar that does?`,
        prompt: feasible ? `Tell me more about ${title}: timing, meeting point and what to bring.` : `Find me something like ${title} that fits the ship's schedule.`,
        cta: feasible ? "Ask Migo" : "Find alternatives",
      });
    }, 900);
    return () => clearTimeout(t);
  }, [excursionId, title, feasible]);
  return null;
}

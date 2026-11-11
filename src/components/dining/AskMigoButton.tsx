"use client";

import { useCompanion } from "@/components/migo/CompanionProvider";

export function AskMigoButton({ prompt, children, className = "btn btn-primary" }: { prompt: string; children: React.ReactNode; className?: string }) {
  const { openConcierge } = useCompanion();
  return (
    <button className={className} onClick={() => openConcierge(prompt)}>
      {children}
    </button>
  );
}

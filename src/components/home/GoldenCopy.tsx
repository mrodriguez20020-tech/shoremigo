"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-cinematic-lighting"] });
  return () => observer.disconnect();
}

export function GoldenDisclosure() {
  const interim = useSyncExternalStore(subscribe,
    () => !document.documentElement.dataset.cinematicLighting || document.documentElement.dataset.cinematicLighting === "interim",
    () => true);
  return <p data-migo-avoid className="golden-disclosure absolute bottom-6 text-[10px] tracking-wider text-white/70">
    Fictional Aurora Tide and island · {interim ? "concept still" : "illustrative cinematic scene"}, not Ocho Rios or the listed excursion
  </p>;
}

export function GoldenCopy() {
  const golden = useSyncExternalStore(subscribe,
    () => document.documentElement.dataset.cinematicLighting === "sunset",
    () => false);
  return (
    <div className="golden-copy" data-golden-copy={golden ? "sunset" : "interim"}>
      <p className="eyebrow" data-migo-avoid>Ocho Rios · evening plans</p>
      <h2 data-migo-avoid className="font-display mt-4 text-[clamp(2.5rem,4.3vw,4.5rem)] leading-[0.98] tracking-[-0.02em]">
        {golden ? <>The sun goes down.<br /><em className="text-accent">The day doesn&apos;t end.</em></> :
          <>Stay for the evening.<br /><em className="text-accent">Make more of your port call.</em></>}
      </h2>
      <p data-migo-avoid className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft">
        An evening port call opens up a sunset sail. LastBoard checks the planned
        return against the 60-minute all-aboard buffer, so you can plan your time ashore.
      </p>
    </div>
  );
}

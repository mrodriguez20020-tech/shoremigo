"use client";

import { useSyncExternalStore } from "react";
import { usePrefs } from "@/components/prefs/PrefsProvider";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-cinematic-lighting"] });
  return () => observer.disconnect();
}

export function GoldenDisclosure() {
  const { t } = usePrefs();
  const interim = useSyncExternalStore(subscribe,
    () => !document.documentElement.dataset.cinematicLighting || document.documentElement.dataset.cinematicLighting === "interim",
    () => true);
  return <p data-migo-avoid className="golden-disclosure absolute bottom-6 text-[10px] tracking-wider text-white/70">
    {t(interim ? "golden.disclosureStill" : "golden.disclosureFilm")}
  </p>;
}

export function GoldenCopy() {
  const { t } = usePrefs();
  const golden = useSyncExternalStore(subscribe,
    () => document.documentElement.dataset.cinematicLighting === "sunset",
    () => false);
  return (
    <div className="golden-copy" data-golden-copy={golden ? "sunset" : "interim"}>
      <p className="eyebrow" data-migo-avoid>{t("golden.eyebrow")}</p>
      <h2 data-migo-avoid className="font-display mt-4 text-[clamp(2.5rem,4.3vw,4.5rem)] leading-[0.98] tracking-[-0.02em]">
        {t(golden ? "golden.sunset1" : "golden.interim1")}<br />
        <em className="text-accent">{t(golden ? "golden.sunset2" : "golden.interim2")}</em>
      </h2>
      <p data-migo-avoid className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft">
        {t("golden.body")}
      </p>
    </div>
  );
}

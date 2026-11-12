"use client";

import { usePrefs } from "@/components/prefs/PrefsProvider";

/** Compact product credibility; sandbox/demo scope stays visible. */
export function HeroProof() {
  const { t } = usePrefs();
  return (
    <ul data-migo-avoid className="hero-proof" aria-label={t("hero.proofLabel")}>
      <li>{t("hero.proofTiming")}</li>
      <li>{t("hero.proofPayment")}</li>
      <li>{t("hero.proofAI")}</li>
    </ul>
  );
}

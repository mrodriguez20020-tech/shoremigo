"use client";

import { SAILING } from "@/lib/domain/catalog";
import { usePrefs } from "@/components/prefs/PrefsProvider";
import { Reveal } from "@/components/ui/Reveal";

export function HeroCopy() {
  const { t } = usePrefs();
  return (
    <>
      <Reveal>
        <p className="eyebrow flex flex-wrap items-center gap-3">
          <span>
            {SAILING.ship} · {SAILING.name}
          </span>
          <span className="demo-tag">Demo sailing</span>
        </p>
      </Reveal>
      <Reveal delay={0.1}>
        <h1 className="font-display mt-6 max-w-[15ch] text-[clamp(2.9rem,6.2vw,6.2rem)] leading-[0.94] tracking-[-0.03em] [text-shadow:0_2px_40px_rgba(4,30,50,0.35)]">
          {t("hero.title1")} <em className="shimmer-text not-italic sm:italic">{t("hero.title2")}</em>
        </h1>
      </Reveal>
      <Reveal delay={0.2}>
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl [text-shadow:0_1px_20px_rgba(4,30,50,0.4)]">{t("hero.sub")}</p>
        <p className="mt-3 text-sm font-semibold tracking-wide text-accent">{t("hero.eyebrow")}.</p>
      </Reveal>
    </>
  );
}

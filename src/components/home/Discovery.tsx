"use client";

import Image from "next/image";
import { usePrefs } from "@/components/prefs/PrefsProvider";
import { TideLink } from "@/components/transition/TideTransition";
import { Reveal } from "@/components/ui/Reveal";
import type { Key } from "@/lib/client/i18n";

const TILES: { kind: "adventure" | "taste" | "ships" | "relax"; image: string; href: string; title: Key; sub: Key }[] = [
  { kind: "adventure", image: "caribbean-shore", href: "/excursions", title: "disc.adventure", sub: "disc.adventureSub" },
  { kind: "taste", image: "dining", href: "/taste", title: "disc.taste", sub: "disc.tasteSub" },
  { kind: "ships", image: "ship", href: "/ships", title: "disc.ships", sub: "disc.shipsSub" },
  { kind: "relax", image: "golden-ocean", href: "/excursions?mood=relax", title: "disc.relax", sub: "disc.relaxSub" },
];

export function Discovery() {
  const { t } = usePrefs();
  return (
    <section id="discover" className="relative scroll-mt-24 px-5 py-24 sm:px-10">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <p className="eyebrow">{t("disc.eyebrow")}</p>
          <h2 className="font-display mt-3 max-w-3xl text-5xl leading-[1.02] sm:text-6xl">{t("disc.title")}</h2>
        </Reveal>
        <p className="mt-4 text-xs text-ink-soft">Photography sets the mood; it does not depict the listed tours, dining venues or our fictional vessel.</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {TILES.map((tile, i) => (
            <Reveal key={tile.kind} delay={i * 0.06}>
              <TideLink href={tile.href} className="group surface block h-full overflow-hidden transition hover:-translate-y-1">
                <div className="relative aspect-[5/3] overflow-hidden">
                  <div className="absolute inset-0 transition duration-700 group-hover:scale-105">
                    <Image src={`/images/${tile.image}.webp`} alt="" fill sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 25vw" className="object-cover" />
                  </div>
                  <span className="absolute bottom-2 left-3 rounded bg-black/65 px-2 py-1 text-[9px] tracking-wide text-white">Illustrative photo</span>
                </div>
                <div className="p-6">
                  <p className="font-display text-2xl">{t(tile.title)}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t(tile.sub)}</p>
                  <p className="mt-4 text-sm font-bold text-accent">
                    →<span className="sr-only"> {t(tile.title)}</span>
                  </p>
                </div>
              </TideLink>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-16">
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Discover", "Browse tours, food and your ship. Every listing shows its real schedule fit."],
              ["Plan with Migo", "Tell Migo your port time and interests; he searches the live catalog with approved tools."],
              ["Book", "Seats are held for 15 minutes while you pay in PayPal (sandbox); the server verifies every capture."],
              ["Adapt", "If the ship runs late, Trip Rescue finds options that still fit, with operator and customer approval."],
            ].map(([h, p], i) => (
              <li key={h} className="surface rounded-[24px] p-6">
                <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">Step {i + 1}</p>
                <p className="font-display mt-2 text-xl">{h}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

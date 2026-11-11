"use client";

import { usePrefs } from "@/components/prefs/PrefsProvider";
import { TideLink } from "@/components/transition/TideTransition";
import { Reveal } from "@/components/ui/Reveal";
import type { Key } from "@/lib/client/i18n";

/** Original vector vignettes (no stock photos): each tile is drawn in code. */
function Vignette({ kind }: { kind: "adventure" | "taste" | "ships" | "relax" }) {
  const common = { viewBox: "0 0 400 240", className: "absolute inset-0 h-full w-full", preserveAspectRatio: "xMidYMid slice" as const };
  if (kind === "adventure")
    return (
      <svg {...common} aria-hidden>
        <defs>
          <linearGradient id="va" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2aa7b7" />
            <stop offset="1" stopColor="#0d2f43" />
          </linearGradient>
        </defs>
        <rect width="400" height="240" fill="url(#va)" />
        <path d="M0 150 Q100 120 200 150 T400 150 V240 H0Z" fill="#0f5a4a" opacity=".55" />
        <path d="M40 240 L120 110 L170 170 L230 80 L320 240Z" fill="#0b4a3d" />
        <path d="M230 80 L250 112 L238 108 L226 118 L214 104Z" fill="#9ff0cf" opacity=".6" />
        {[60, 140, 300].map((x, i) => (
          <circle key={i} cx={x} cy={200 - i * 8} r={4 + i} fill="#65d6cf" opacity=".5" />
        ))}
      </svg>
    );
  if (kind === "taste")
    return (
      <svg {...common} aria-hidden>
        <defs>
          <radialGradient id="vt" cx=".5" cy=".55" r=".7">
            <stop offset="0" stopColor="#f4c777" />
            <stop offset="1" stopColor="#8a3b2a" />
          </radialGradient>
        </defs>
        <rect width="400" height="240" fill="url(#vt)" />
        <ellipse cx="200" cy="140" rx="120" ry="44" fill="#f9f6ee" opacity=".92" />
        <ellipse cx="200" cy="134" rx="92" ry="30" fill="#e9a35c" />
        <circle cx="170" cy="128" r="12" fill="#5d8a3a" />
        <circle cx="222" cy="126" r="10" fill="#c2412d" />
        <circle cx="198" cy="140" r="8" fill="#f4c777" />
        <path d="M320 70 q14 30 0 60" stroke="#f9f6ee" strokeWidth="4" fill="none" opacity=".6" />
      </svg>
    );
  if (kind === "ships")
    return (
      <svg {...common} aria-hidden>
        <defs>
          <linearGradient id="vs" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f69a8e" />
            <stop offset=".6" stopColor="#40c7c5" />
            <stop offset="1" stopColor="#0d2f43" />
          </linearGradient>
        </defs>
        <rect width="400" height="240" fill="url(#vs)" />
        <path d="M70 165 H330 L300 200 H100Z" fill="#f9f6ee" />
        <rect x="110" y="130" width="190" height="35" rx="4" fill="#f9f6ee" />
        <rect x="140" y="102" width="130" height="28" rx="4" fill="#f9f6ee" opacity=".95" />
        <rect x="180" y="80" width="26" height="22" fill="#f69a8e" />
        {Array.from({ length: 9 }, (_, i) => (
          <rect key={i} x={120 + i * 20} y={142} width="10" height="8" rx="2" fill="#0d2f43" opacity=".6" />
        ))}
        <path d="M0 205 Q100 195 200 205 T400 205 V240 H0Z" fill="#0d2f43" opacity=".6" />
      </svg>
    );
  return (
    <svg {...common} aria-hidden>
      <defs>
        <linearGradient id="vr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd9a8" />
          <stop offset=".55" stopColor="#f4c777" />
          <stop offset=".56" stopColor="#65d6cf" />
          <stop offset="1" stopColor="#2a9fb0" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#vr)" />
      <circle cx="290" cy="95" r="30" fill="#fff6e0" opacity=".9" />
      <path d="M0 180 Q200 160 400 182 V240 H0Z" fill="#f3dfb0" />
      <path d="M90 180 l70 -8 l8 8 l-72 8z" fill="#f69a8e" />
      <path d="M150 120 v52" stroke="#0d2f43" strokeWidth="3" />
      <path d="M110 122 q40 -26 80 0z" fill="#f9f6ee" />
    </svg>
  );
}

const TILES: { kind: "adventure" | "taste" | "ships" | "relax"; href: string; title: Key; sub: Key }[] = [
  { kind: "adventure", href: "/excursions", title: "disc.adventure", sub: "disc.adventureSub" },
  { kind: "taste", href: "/taste", title: "disc.taste", sub: "disc.tasteSub" },
  { kind: "ships", href: "/ships", title: "disc.ships", sub: "disc.shipsSub" },
  { kind: "relax", href: "/excursions?mood=relax", title: "disc.relax", sub: "disc.relaxSub" },
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
        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {TILES.map((tile, i) => (
            <Reveal key={tile.kind} delay={i * 0.06}>
              <TideLink href={tile.href} className="group surface block overflow-hidden rounded-[28px] transition hover:-translate-y-1">
                <div className="relative aspect-[5/3] overflow-hidden">
                  <div className="absolute inset-0 transition duration-700 group-hover:scale-105">
                    <Vignette kind={tile.kind} />
                  </div>
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

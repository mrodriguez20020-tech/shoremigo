"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AMENITIES, CABINS, DECKS, DEMO_CABIN, DEMO_SHIP, type CabinView, type Deck } from "@/lib/domain/ship";
import { SHIP_VENUES } from "@/lib/domain/dining";
import { MenuViewer } from "@/components/dining/MenuViewer";
import { TideLink } from "@/components/transition/TideTransition";

type Tab = "overview" | "decks" | "rooms" | "dining" | "amenities";
const TABS: [Tab, string][] = [
  ["overview", "Overview"],
  ["decks", "Decks"],
  ["rooms", "Rooms"],
  ["dining", "Dining"],
  ["amenities", "Amenities"],
];
const ZONE_COLOR: Record<Deck["zone"], string> = {
  rooms: "#40c7c5",
  dining: "#f4c777",
  entertainment: "#f69a8e",
  pool: "#65d6cf",
  wellness: "#b9a3e3",
  service: "#9fb3c0",
};

/** Side profile of the demo vessel; decks are clickable bands when `onPick` is set. */
function ShipProfile({ selected, onPick }: { selected?: number; onPick?: (n: number) => void }) {
  const top = 40;
  const h = 18;
  return (
    <svg viewBox="0 0 900 330" className="w-full" role={onPick ? "group" : "img"} aria-label="Aurora Tide side profile (demo vessel)">
      <defs>
        <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f9f6ee" />
          <stop offset="1" stopColor="#d9e4e8" />
        </linearGradient>
      </defs>
      <path d="M0 300 Q225 285 450 300 T900 300 V330 H0Z" fill="#0d2f43" opacity=".55" />
      <path d="M60 238 H850 L800 300 H110Z" fill="#0d2f43" />
      <rect x="742" y="20" width="34" height="34" rx="6" fill="#f69a8e" />
      {DECKS.map((d, i) => {
        const y = top + i * h;
        const inset = Math.max(0, (4 - i) * 26);
        const x = 120 + inset;
        const w = 680 - inset * 1.4;
        const active = selected === d.number;
        return (
          <g
            key={d.number}
            onClick={onPick ? () => onPick(d.number) : undefined}
            onKeyDown={onPick ? (e) => (e.key === "Enter" || e.key === " ") && onPick(d.number) : undefined}
            tabIndex={onPick ? 0 : undefined}
            role={onPick ? "button" : undefined}
            aria-label={onPick ? `Deck ${d.number}: ${d.name}` : undefined}
            aria-pressed={onPick ? active : undefined}
            className={onPick ? "cursor-pointer outline-none focus-visible:[&>rect]:stroke-[#0d2f43]" : undefined}
          >
            <rect x={x} y={y} width={w} height={h - 2} rx="3" fill={active ? ZONE_COLOR[d.zone] : "url(#hull)"} stroke={active ? "#0d2f43" : "#b8c7cd"} strokeWidth={active ? 2 : 1} />
            {Array.from({ length: Math.floor(w / 26) }, (_, k) => (
              <rect key={k} x={x + 10 + k * 26} y={y + 5} width="12" height="6" rx="2" fill="#0d2f43" opacity={active ? 0.5 : 0.25} />
            ))}
            {onPick && (
              <text x={x - 10} y={y + 12} textAnchor="end" fontSize="11" fontWeight="700" fill="currentColor" opacity={active ? 1 : 0.7}>
                {d.number}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Original vector interior scenes for the demo cabin walkthrough (not photos, not 360°). */
function CabinScene({ view }: { view: CabinView["id"] }) {
  const night = view === "evening";
  return (
    <svg viewBox="0 0 800 450" className="h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`sea-${view}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night ? "#1b2a4a" : "#9fdcf0"} />
          <stop offset=".55" stopColor={night ? "#3a2f5a" : "#f4e4c4"} />
          <stop offset=".56" stopColor={night ? "#0b1f36" : "#40c7c5"} />
          <stop offset="1" stopColor={night ? "#071526" : "#0d5c78"} />
        </linearGradient>
      </defs>
      {view === "bathroom" ? (
        <>
          <rect width="800" height="450" fill="#eef3f2" />
          <rect x="60" y="40" width="300" height="370" rx="10" fill="#dfe9ea" stroke="#b9cbcf" />
          <rect x="80" y="60" width="260" height="330" rx="6" fill="#cfe7ea" opacity=".6" />
          <circle cx="210" cy="90" r="16" fill="#9fb3c0" />
          <rect x="430" y="210" width="300" height="40" rx="8" fill="#f9f6ee" stroke="#c9d6d9" />
          <ellipse cx="580" cy="230" rx="60" ry="12" fill="#dfe9ea" />
          <rect x="470" y="60" width="220" height="130" rx="10" fill="#cfe2ea" stroke="#b9cbcf" />
          <rect x="430" y="250" width="300" height="160" fill="#e7eeee" />
          <rect x="740" y="120" width="14" height="140" rx="7" fill="#40c7c5" opacity=".5" />
        </>
      ) : view === "balcony" ? (
        <>
          <rect width="800" height="450" fill={`url(#sea-${view})`} />
          <circle cx="600" cy="140" r="40" fill="#fff6e0" opacity=".9" />
          <rect x="0" y="300" width="800" height="150" fill="#5a4a3a" />
          {Array.from({ length: 16 }, (_, i) => (
            <rect key={i} x={i * 52} y="300" width="48" height="150" fill="#6b5847" opacity=".7" />
          ))}
          <rect x="0" y="250" width="800" height="10" fill="#c9d6d9" />
          <rect x="0" y="256" width="800" height="50" fill="#d9eef3" opacity=".35" />
          <path d="M120 340 l180 -20 l10 30 l-180 20z" fill="#f9f6ee" />
          <path d="M420 340 l180 -20 l10 30 l-180 20z" fill="#f9f6ee" />
          <circle cx="370" cy="345" r="26" fill="#f69a8e" />
        </>
      ) : (
        <>
          <rect width="800" height="450" fill={night ? "#2a2440" : "#f3ede2"} />
          <rect x="430" y="40" width="330" height="300" rx="6" fill={`url(#sea-${view})`} stroke={night ? "#5a5070" : "#d8cfbf"} strokeWidth="8" />
          {night && <circle cx="680" cy="110" r="18" fill="#fff6e0" opacity=".8" />}
          {night && <path d="M430 300 Q600 260 760 300" stroke="#65d6cf" strokeWidth="3" fill="none" opacity=".5" />}
          <rect x="40" y="250" width="380" height="120" rx="14" fill={night ? "#4a4060" : "#f9f6ee"} />
          <rect x="40" y="230" width="380" height="40" rx="12" fill={night ? "#5a5070" : "#ffffff"} />
          <rect x="60" y="210" width="110" height="36" rx="12" fill={night ? "#6a6082" : "#e9e2d5"} />
          <rect x="190" y="210" width="110" height="36" rx="12" fill={night ? "#6a6082" : "#e9e2d5"} />
          <rect x="40" y="300" width="380" height="20" fill="#40c7c5" opacity=".7" />
          <rect x="40" y="60" width="200" height="120" rx="6" fill={night ? "#3a3450" : "#e6dccb"} />
          <path d="M60 160 q40 -60 80 -20 t80 -10" stroke={night ? "#f4c777" : "#f69a8e"} strokeWidth="4" fill="none" />
          {night && <circle cx="300" cy="120" r="70" fill="#f4c777" opacity=".08" />}
          <rect x="0" y="370" width="800" height="80" fill={night ? "#1f1a30" : "#d9cdb8"} />
        </>
      )}
    </svg>
  );
}

export function ShipExplorer() {
  const [tab, setTab] = useState<Tab>("overview");
  const [deck, setDeck] = useState(9);
  const [walk, setWalk] = useState(false);
  const [view, setView] = useState(0);
  const [venue, setVenue] = useState(SHIP_VENUES[0].id);
  useEffect(() => {
    document.documentElement.dataset.migoSurface = tab === "rooms" && walk ? "cabin" : "deck";
    return () => { delete document.documentElement.dataset.migoSurface; };
  }, [tab, walk]);
  const d = DECKS.find((x) => x.number === deck)!;
  const v = DEMO_CABIN.views[view];

  useEffect(() => {
    if (!walk) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setView((i) => (i + 1) % DEMO_CABIN.views.length);
      if (e.key === "ArrowLeft") setView((i) => (i - 1 + DEMO_CABIN.views.length) % DEMO_CABIN.views.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [walk]);

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Ship sections">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`btn !py-2 text-sm ${tab === id ? "btn-primary" : "btn-ghost"}`}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} role="tabpanel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }} className="mt-6">
          {tab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="surface rounded-[28px] p-5 sm:p-8">
                <ShipProfile />
              </div>
              <div className="surface rounded-[28px] p-6 sm:p-8">
                <p className="eyebrow">{DEMO_SHIP.status}</p>
                <h2 className="font-display mt-2 text-4xl">{DEMO_SHIP.name}</h2>
                <p className="mt-3 text-ink-soft">{DEMO_SHIP.intro}</p>
                <dl className="mt-6 grid grid-cols-2 gap-4">
                  {DEMO_SHIP.facts.map(([k, val]) => (
                    <div key={k}>
                      <dt className="text-[10px] font-bold tracking-[0.2em] text-ink-soft uppercase">{k}</dt>
                      <dd className="mt-0.5 font-semibold">{val}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button className="btn btn-primary !py-2 text-sm" onClick={() => setTab("rooms")}>
                    See the rooms
                  </button>
                  <button className="btn btn-ghost !py-2 text-sm" onClick={() => setTab("decks")}>
                    Walk the decks
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "decks" && (
            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="surface rounded-[28px] p-5 sm:p-8">
                <p className="mb-3 text-xs text-ink-soft">Select a deck (click, or Tab then Enter).</p>
                <ShipProfile selected={deck} onPick={setDeck} />
                <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-ink-soft">
                  {Object.entries(ZONE_COLOR).map(([z, c]) => (
                    <span key={z} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} /> {z}
                    </span>
                  ))}
                </div>
              </div>
              <motion.div key={deck} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="surface rounded-[28px] p-6 sm:p-8" aria-live="polite">
                <p className="eyebrow">Deck {d.number}</p>
                <h3 className="font-display mt-1 text-3xl">{d.name}</h3>
                <ul className="mt-4 space-y-2">
                  {d.highlights.map((h) => (
                    <li key={h} className="flex gap-2">
                      <span className="text-accent">◆</span> {h}
                    </li>
                  ))}
                </ul>
                {d.zone === "rooms" && (
                  <button className="btn btn-ghost mt-6 !py-2 text-sm" onClick={() => setTab("rooms")}>
                    Cabins on this deck →
                  </button>
                )}
                <p className="mt-6 text-[11px] text-ink-soft">Illustrative layout of a fictional ship, not a real cruise-line deck plan.</p>
              </motion.div>
            </div>
          )}

          {tab === "rooms" && (
            <div>
              {walk ? (
                <div className="surface overflow-hidden rounded-[28px]">
                  <div className="relative aspect-[16/9] max-h-[62vh] w-full">
                    <AnimatePresence mode="wait">
                      <motion.div key={v.id} className="absolute inset-0" initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
                        <CabinScene view={v.id} />
                      </motion.div>
                    </AnimatePresence>
                    <span className="demo-tag absolute left-4 top-4">Illustrative cabin · demo</span>
                    <button className="btn btn-ghost absolute right-4 top-4 !py-1.5 text-xs" onClick={() => setWalk(false)}>
                      ✕ Close
                    </button>
                    <button aria-label="Previous view" className="btn btn-ghost absolute left-3 top-1/2 !h-11 !w-11 -translate-y-1/2 !p-0" onClick={() => setView((i) => (i - 1 + DEMO_CABIN.views.length) % DEMO_CABIN.views.length)}>
                      ‹
                    </button>
                    <button aria-label="Next view" className="btn btn-ghost absolute right-3 top-1/2 !h-11 !w-11 -translate-y-1/2 !p-0" onClick={() => setView((i) => (i + 1) % DEMO_CABIN.views.length)}>
                      ›
                    </button>
                  </div>
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                    <div aria-live="polite">
                      <p className="eyebrow">Cabin {DEMO_CABIN.number} · Balcony Stateroom · Deck 9</p>
                      <p className="font-display mt-1 text-2xl">{v.title}</p>
                      <p className="mt-1 max-w-xl text-sm text-ink-soft">{v.caption}</p>
                    </div>
                    <div className="flex gap-2" role="tablist" aria-label="Cabin views">
                      {DEMO_CABIN.views.map((cv, i) => (
                        <button key={cv.id} role="tab" aria-selected={i === view} onClick={() => setView(i)} className={`h-14 w-20 overflow-hidden rounded-xl border-2 ${i === view ? "border-accent" : "border-transparent opacity-70"}`} aria-label={cv.title}>
                          <CabinScene view={cv.id} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {CABINS.map((c) => (
                    <article key={c.id} className="surface flex flex-col overflow-hidden rounded-[24px]">
                      <div className="aspect-[4/3]">
                        <CabinScene view={c.balcony ? "balcony" : c.id === "oceanview" ? "bedroom" : "bedroom"} />
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="font-display text-2xl">{c.name}</h3>
                        <p className="mt-1 text-xs text-ink-soft">
                          {c.occupancy} · {c.beds} · {c.size}
                        </p>
                        <ul className="mt-3 flex flex-wrap gap-1.5">
                          {c.features.map((f) => (
                            <li key={f} className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">
                              {f}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-auto pt-5">
                          {c.walkthrough ? (
                            <button
                              className="btn btn-primary w-full !py-2 text-sm"
                              onClick={() => {
                                setView(0);
                                setWalk(true);
                              }}
                            >
                              Walk through cabin {DEMO_CABIN.number}
                            </button>
                          ) : (
                            <p className="text-[11px] text-ink-soft">Walkthrough available for the demo balcony cabin only.</p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <p className="mt-4 text-[11px] text-ink-soft">Concept vessel and illustrative cabins. ShoreMigo doesn&apos;t sell cruise cabins and shows no live cabin inventory.</p>
            </div>
          )}

          {tab === "dining" && (
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                {SHIP_VENUES.map((sv) => (
                  <button key={sv.id} onClick={() => setVenue(sv.id)} className={`rounded-full px-4 py-2 text-sm font-semibold ${venue === sv.id ? "bg-accent text-accent-ink" : "bg-white/10 text-ink-soft"}`}>
                    {sv.name}
                  </button>
                ))}
              </div>
              <MenuViewer key={venue} venue={SHIP_VENUES.find((sv) => sv.id === venue)!} />
              <p className="mt-3 text-[11px] text-ink-soft">
                Onboard dining is separate from shore restaurants. For island food, see{" "}
                <TideLink href="/taste" className="underline">
                  Taste &amp; Indulge
                </TideLink>
                .
              </p>
            </div>
          )}

          {tab === "amenities" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {AMENITIES.map((a) => (
                <button
                  key={a.name}
                  className="surface rounded-[24px] p-5 text-left transition hover:-translate-y-0.5"
                  onClick={() => {
                    setDeck(a.deck);
                    setTab("decks");
                  }}
                >
                  <p className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">Deck {a.deck}</p>
                  <p className="font-display mt-1 text-xl">{a.name}</p>
                  <p className="mt-1 text-sm text-ink-soft">{a.blurb}</p>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

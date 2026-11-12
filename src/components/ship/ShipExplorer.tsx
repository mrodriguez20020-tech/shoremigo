"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import {
  AMENITIES, CABIN_7214, CABIN_CATEGORIES, CORES, CORRIDOR_HALF_WIDTH, DECKS, DEMO_SHIP, FUTURE_CONCEPTS, LOUNGE, PROFILE, REMOVED_AMENITIES,
  VESSEL, VESSEL_SOURCE, amenitiesOnDeck, categoryOf, deckInfo, outlineFor, slotsOnDeck, type Slot,
} from "@/lib/domain/ship";
import { SHIP_VENUES } from "@/lib/domain/dining";
import { MenuViewer } from "@/components/dining/MenuViewer";
import { TideLink } from "@/components/transition/TideTransition";
import { Cabin7214Experience } from "./Cabin7214";

type Tab = "overview" | "decks" | "rooms" | "cabin" | "dining" | "amenities";
const TABS: [Tab, string][] = [
  ["overview", "Overview"],
  ["decks", "Decks"],
  ["rooms", "Rooms"],
  ["cabin", "Cabin 7214"],
  ["dining", "Dining"],
  ["amenities", "Amenities"],
];
const MAT_FILL: Record<string, string> = { hull: VESSEL.palette.hull, superstructure: VESSEL.palette.superstructure, glazing: VESSEL.palette.glazing, teak: VESSEL.palette.deckTeak, lifeboat: VESSEL.palette.lifeboat, funnel: VESSEL.palette.funnelCasing, exhaust: VESSEL.palette.exhaust, radome: "#fbfbf8" };
const CAT_FILL: Record<string, string> = { oceanview: "#9fc8d6", "premium-balcony": "#f1ece2", "signature-7214": "#40c7c5" };
const LENGTH = VESSEL.lengthM;

/** Port elevation drawn from the canonical massing (sliced from the WP-02 GLB). Deck bands are selectable. */
function ShipElevation({ selected, onPick }: { selected?: number; onPick?: (deck: number) => void }) {
  const k = 5.4, ox = 30, base = 232, X = (x: number) => ox + x * k, Z = (z: number) => base - z * k;
  return (
    <svg viewBox={`0 0 ${X(LENGTH) + 40} 250`} className="w-full" role={onPick ? "group" : "img"} aria-label={`${VESSEL.name} port elevation (fictional vessel, provisional design)`}>
      <rect x="0" y={Z(VESSEL.waterlineZ)} width={X(LENGTH) + 40} height={250 - Z(VESSEL.waterlineZ)} fill="#0d2f43" opacity=".35" />
      {PROFILE.map((p) => (
        <polygon key={p.solid} points={p.points.map(([x, z]) => `${X(x).toFixed(1)},${Z(z).toFixed(1)}`).join(" ")} fill={MAT_FILL[p.material] ?? "#ccc"} stroke={p.material === "superstructure" ? "#b9b2a4" : "none"} strokeWidth=".6" />
      ))}
      {onPick && DECKS.map((d) => {
        const active = selected === d.deck, z0 = d.z, z1 = d.z + 2.9;
        return (
          <g key={d.deck} role="button" tabIndex={0} aria-label={`Deck ${d.deck}: ${d.name}`} aria-pressed={active}
            onClick={() => onPick(d.deck)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onPick(d.deck))}
            className="deck-band cursor-pointer outline-none">
            <rect x={X(0)} y={Z(z1)} width={LENGTH * k} height={(z1 - z0) * k} fill={active ? "#40c7c5" : "transparent"} fillOpacity={active ? 0.32 : 0} stroke={active ? "#40c7c5" : "transparent"} strokeWidth="1.5" />
            <text x={ox - 8} y={Z(z0 + 1.1)} textAnchor="end" fontSize="9" fontWeight="700" fill="currentColor" opacity={active ? 1 : 0.6}>{d.deck}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Top-down deck plan: canonical side line for the deck, corridor, cores and every stateroom slot. */
function DeckPlan({ deck, picked, onPick }: { deck: number; picked: number | null; onPick: (s: Slot) => void }) {
  const k = 6.2, ox = 12, cy = 82, X = (x: number) => ox + x * k, Y = (y: number) => cy - y * k;
  const line = outlineFor(deck), slots = slotsOnDeck(deck);
  const side = (x: number) => { let best = line[0]; for (const p of line) if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p; return best ? best[1] : 0; };
  const pts = [...line.map(([x, y]) => [X(x), Y(y)]), ...[...line].reverse().map(([x, y]) => [X(x), Y(-y)])];
  return (
    <svg viewBox={`0 0 ${X(LENGTH) + 14} 164`} className="w-full" role="group" aria-label={`Deck ${deck} plan`}>
      <polygon points={pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ")} fill="#f1ece2" fillOpacity=".1" stroke="#f1ece2" strokeOpacity=".5" />
      {slots.length > 0 && <rect x={X(Math.min(...slots.map((s) => s.xFrom)))} y={Y(CORRIDOR_HALF_WIDTH)} width={(Math.max(...slots.map((s) => s.xTo)) - Math.min(...slots.map((s) => s.xFrom))) * k} height={2 * CORRIDOR_HALF_WIDTH * k} fill="#cfc6b4" fillOpacity=".25" />}
      {slots.length > 0 && CORES.map(([a, b]) => <rect key={a} x={X(a)} y={Y(4)} width={(b - a) * k} height={8 * k} fill="#b7ae9c" fillOpacity=".3" />)}
      {deck === LOUNGE.deck && <rect x={X(LOUNGE.xAft)} y={Y(side(LOUNGE.xAft + 2) - 0.2)} width={(LOUNGE.xFwd - LOUNGE.xAft) * k} height={2 * (side(LOUNGE.xAft + 2) - 0.2) * k} fill="#40c7c5" fillOpacity=".25" />}
      {slots.map((s) => {
        const sg = s.side === "port" ? 1 : -1, outer = Math.min(side(s.xFrom), side(s.xTo)), cat = categoryOf(s), on = picked === s.num;
        return (
          <rect key={s.num} x={X(s.xFrom) + 0.4} y={sg > 0 ? Y(outer) : Y(-CORRIDOR_HALF_WIDTH)} width={(s.xTo - s.xFrom) * k - 0.8} height={(outer - CORRIDOR_HALF_WIDTH) * k}
            fill={on ? "#e8c895" : CAT_FILL[cat]} fillOpacity={on ? 0.95 : cat === "signature-7214" ? 0.9 : 0.55} stroke="#081e27" strokeWidth=".5"
            role="button" tabIndex={0} aria-label={`Cabin ${s.num}, ${s.type}, ${s.side}`} aria-pressed={on}
            onClick={() => onPick(s)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onPick(s))} className="cursor-pointer outline-none" />
        );
      })}
      <text x={X(2)} y={160} fontSize="8" fill="currentColor" opacity=".55">aft</text>
      <text x={X(LENGTH) - 14} y={160} fontSize="8" fill="currentColor" opacity=".55">bow</text>
    </svg>
  );
}

export function ShipExplorer() {
  const [tab, setTab] = useState<Tab>("overview");
  const [deck, setDeck] = useState(7);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [venue, setVenue] = useState(SHIP_VENUES[0].id);
  useEffect(() => {
    document.documentElement.dataset.migoSurface = tab === "cabin" ? "cabin" : "deck";
    return () => { delete document.documentElement.dataset.migoSurface; };
  }, [tab]);
  useEffect(() => { setSlot(null); }, [deck]);
  const d = deckInfo(deck);
  const deckSlots = useMemo(() => slotsOnDeck(deck), [deck]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of deckSlots) c[s.type] = (c[s.type] ?? 0) + 1;
    return Object.entries(c);
  }, [deckSlots]);
  const goDeck = (n: number) => { setDeck(n); setTab("decks"); };

  return (
    <div className="ship-explorer">
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
            <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="surface rounded-[28px] p-5 sm:p-8">
                <ShipElevation />
                <p className="mt-3 text-[11px] text-ink-soft">Port elevation drawn from the provisional design-control model ({VESSEL_SOURCE.specVersion}). Schematic massing, not a render.</p>
              </div>
              <div className="surface rounded-[28px] p-6 sm:p-8">
                <p className="eyebrow">{DEMO_SHIP.status}</p>
                <h2 className="font-display mt-2 text-4xl">{DEMO_SHIP.name}</h2>
                <p className="mt-3 text-ink-soft">{DEMO_SHIP.intro}</p>
                <dl className="mt-6 grid grid-cols-2 gap-4">
                  {DEMO_SHIP.facts.map(([key, val]) => (
                    <div key={key}>
                      <dt className="text-[10px] font-bold tracking-[0.2em] text-ink-soft uppercase">{key}</dt>
                      <dd className="mt-0.5 font-semibold">{val}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button className="btn btn-primary !py-2 text-sm" onClick={() => setTab("cabin")}>Explore Cabin 7214</button>
                  <button className="btn btn-ghost !py-2 text-sm" onClick={() => setTab("decks")}>Walk the decks</button>
                </div>
              </div>
            </div>
          )}

          {tab === "decks" && (
            <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="surface rounded-[28px] p-5 sm:p-7">
                <p className="mb-2 text-xs text-ink-soft">Select a deck on the elevation (click, or Tab then Enter). Decks 1–2 are below the waterline.</p>
                <ShipElevation selected={deck} onPick={setDeck} />
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="mb-2 text-xs text-ink-soft">Deck {deck} plan{deckSlots.length ? ": select a stateroom" : ""}</p>
                  <DeckPlan deck={deck} picked={slot?.num ?? null} onPick={setSlot} />
                  <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-ink-soft">
                    {[["oceanview", "Oceanview"], ["premium-balcony", "Premium Balcony"], ["signature-7214", "Cabin 7214"]].map(([id, label]) => (
                      <span key={id} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: CAT_FILL[id] }} /> {label}</span>
                    ))}
                  </div>
                </div>
              </div>
              <motion.div key={`${deck}-${slot?.num ?? ""}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="surface rounded-[28px] p-6 sm:p-8" aria-live="polite">
                <p className="eyebrow">Deck {d.deck}</p>
                <h3 className="font-display mt-1 text-3xl">{d.name}</h3>
                <p className="mt-2 text-sm text-ink-soft">{d.use}</p>
                {amenitiesOnDeck(deck).length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {amenitiesOnDeck(deck).map((a) => (
                      <li key={a.name} className="flex gap-2 text-sm"><span className="text-accent">◆</span><span><b className="font-semibold">{a.name}</b>{" · "}{a.where}{a.provisional ? " (proposed location)" : ""}</span></li>
                    ))}
                  </ul>
                )}
                {counts.length > 0 && (
                  <p className="mt-4 text-sm"><span className="text-ink-soft">Staterooms: </span>{counts.map(([t, n]) => `${n} ${t}`).join(" · ")}</p>
                )}
                {slot && (
                  <div className="mt-5 rounded-2xl border border-accent/40 bg-accent/10 p-4">
                    <p className="font-display text-xl">Cabin {slot.num}</p>
                    <p className="mt-1 text-sm text-ink-soft">{slot.type} · {slot.side} side · deck {slot.deck}</p>
                    <p className="mt-1 text-sm">{slot.balconyDepth > 0 ? `Balcony ${slot.balconyDepth.toFixed(2)} m deep · ${slot.balconyM2.toFixed(2)} m²` : "Sea-view window (no balcony)"}</p>
                    {slot.num === Number(CABIN_7214.number) && <button className="btn btn-primary mt-3 !py-2 text-sm" onClick={() => setTab("cabin")}>Explore Cabin 7214 →</button>}
                  </div>
                )}
                <p className="mt-6 text-[11px] text-ink-soft">Fictional ship. Plans come from the provisional design-control model under independent review; not a real cruise-line deck plan or cabin inventory.</p>
              </motion.div>
            </div>
          )}

          {tab === "rooms" && (
            <div>
              <div className="grid gap-5 md:grid-cols-3">
                {CABIN_CATEGORIES.map((c) => (
                  <article key={c.id} className="surface flex flex-col rounded-[24px] p-6">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">Deck{c.decks.length > 1 ? "s" : ""} {c.decks.join(", ")}</p>
                    <h3 className="font-display mt-1 text-2xl">{c.name}</h3>
                    <dl className="mt-4 space-y-1.5 text-sm">
                      <div className="flex justify-between"><dt className="text-ink-soft">{c.id === "signature-7214" ? "Net interior" : "Interior module"}</dt><dd className="font-semibold">{c.interiorM2.toFixed(1)} m²</dd></div>
                      <div className="flex justify-between"><dt className="text-ink-soft">Balcony</dt><dd className="font-semibold">{c.balconyM2 ? `${c.balconyM2.toFixed(1)} m²` : "Sea-view window"}</dd></div>
                      <div className="flex justify-between"><dt className="text-ink-soft">Bed</dt><dd className="font-semibold">{c.beds}</dd></div>
                      <div className="flex justify-between"><dt className="text-ink-soft">On board</dt><dd className="font-semibold">{c.count} {c.count === 1 ? "cabin" : "cabins"}</dd></div>
                    </dl>
                    {"variants" in c && c.variants.map((v) => (
                      <p key={v.name} className="mt-3 text-[11px] text-ink-soft">Cabins {v.cabins.join(" & ")} have a forward tapered balcony ({v.balconyDepth.toFixed(2)} m, {v.balconyM2.toFixed(2)} m²).</p>
                    ))}
                    <div className="mt-auto flex flex-wrap gap-2 pt-5">
                      {c.id === "signature-7214"
                        ? <button className="btn btn-primary !py-2 text-sm" onClick={() => setTab("cabin")}>Explore Cabin 7214</button>
                        : <button className="btn btn-ghost !py-2 text-sm" onClick={() => goDeck(c.decks[c.decks.length - 1])}>Find on the deck plan</button>}
                    </div>
                  </article>
                ))}
              </div>
              {FUTURE_CONCEPTS.map((f) => (
                <p key={f.name} className="mt-5 rounded-2xl border border-dashed border-white/20 px-4 py-3 text-sm text-ink-soft"><b className="text-ink">{f.name}</b>: future design concept only, not available accommodation.</p>
              ))}
              <p className="mt-4 text-[11px] text-ink-soft">All {VESSEL.staterooms} staterooms are exterior (oceanview or balcony). Concept vessel: ShoreMigo doesn&apos;t sell cruise cabins and shows no live cabin inventory.</p>
            </div>
          )}

          {tab === "cabin" && <Cabin7214Experience />}

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
                <TideLink href="/taste" className="underline">Taste &amp; Indulge</TideLink>.
              </p>
            </div>
          )}

          {tab === "amenities" && (
            <div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {AMENITIES.map((a) => (
                  <button key={a.name} className="surface rounded-[24px] p-5 text-left transition hover:-translate-y-0.5" onClick={() => goDeck(a.deck)}>
                    <p className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">Deck {a.deck}{a.provisional ? " · proposed" : ""}</p>
                    <p className="font-display mt-1 text-xl">{a.name}</p>
                    <p className="mt-1 text-sm text-ink-soft">{a.where}</p>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-ink-soft">Not part of this boutique ship: {REMOVED_AMENITIES.map((r) => r.name.toLowerCase()).join(", ")}.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

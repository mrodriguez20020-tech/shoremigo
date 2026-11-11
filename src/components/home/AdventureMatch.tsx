"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { PORTS, getExcursion, getPort } from "@/lib/domain/catalog";
import { fmtDuration, fmtUsd } from "@/lib/domain/time";
import type { Category } from "@/lib/domain/types";
import { migo } from "@/components/migo/bus";
import { useCompanion } from "@/components/migo/CompanionProvider";
import { TideLink } from "@/components/transition/TideTransition";
import { ExcursionArt } from "@/components/excursion/ExcursionArt";
import { api, track } from "@/lib/client/track";
import { recordProof } from "@/lib/client/proof";

const VIBES: { id: Category; label: string; icon: string }[] = [
  { id: "snorkel", label: "Under the sea", icon: "🐠" },
  { id: "sail", label: "On the water", icon: "⛵" },
  { id: "nature", label: "Wild nature", icon: "🌿" },
  { id: "adventure", label: "Thrills", icon: "🧗" },
  { id: "culture", label: "Culture", icon: "🥁" },
  { id: "food", label: "Food & craft", icon: "🍫" },
];

const ENERGY = [
  { v: 1, label: "Easy-going", sub: "Gentle pace, lots of views" },
  { v: 2, label: "Balanced", sub: "Some swimming or walking" },
  { v: 3, label: "Bring it on", sub: "Climbs, zips and jumps" },
] as const;

interface Result {
  excursionId: string;
  score: number;
  reasons: string[];
}

export function AdventureMatch() {
  const { openConcierge } = useCompanion();
  const [step, setStep] = useState(0);
  const [portId, setPort] = useState<string>("");
  const [vibes, setVibes] = useState<Category[]>([]);
  const [energy, setEnergy] = useState<1 | 2 | 3>(2);
  const [guests, setGuests] = useState(2);
  const [hours, setHours] = useState<number | "">("");
  const [budget, setBudget] = useState<number | "">("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const start = () => {
    if (step === 0) track("match.started", {});
  };

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const r = await api<{ results: Result[] }>("/api/match", {
        json: { portId, vibes, energy, guests, budgetUsd: budget === "" ? undefined : budget, maxMinutes: hours === "" ? undefined : hours * 60 },
      });
      setResults(r.results);
      recordProof({
        source: "match",
        kind: "engine",
        title: `Adventure Match: ${r.results.length} result${r.results.length === 1 ? "" : "s"}`,
        detail: { port: portId || "any", vibes: vibes.join(",") || "any", energy, guests, filters: "feasible ∧ seats ≥ guests ∧ budget ∧ time", top: r.results.map((x) => x.excursionId).join(", ") || "none" },
      });
      setStep(4);
      track("match.completed", { count: r.results.length, portId: portId || "any" });
      migo.emit({ type: "match:completed", count: r.results.length });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const steps = ["Port", "Vibe", "Energy", "Details"];

  return (
    <div className="surface rounded-[32px] p-6 sm:p-10" onFocus={start} onPointerDown={start}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Migo&apos;s Adventure Match</p>
          <h2 className="font-display mt-2 text-4xl leading-tight sm:text-5xl">Tell me what makes a perfect port day.</h2>
        </div>
        {step < 4 && (
          <ol className="flex gap-2" aria-label="Progress">
            {steps.map((s, i) => (
              <li key={s} className={`h-1.5 w-10 rounded-full transition-colors ${i <= step ? "bg-accent" : "bg-white/15"}`} aria-current={i === step ? "step" : undefined}>
                <span className="sr-only">{s}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="mt-8 min-h-[260px]">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}>
            {step === 0 && (
              <fieldset>
                <legend className="mb-4 text-lg font-semibold">Which port are you dreaming about?</legend>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  {[{ id: "", name: "Surprise me", country: "Any port" }, ...PORTS].map((p) => (
                    <button
                      key={p.id || "any"}
                      type="button"
                      aria-pressed={portId === p.id}
                      onClick={() => setPort(p.id)}
                      className={`rounded-2xl border p-4 text-left transition ${portId === p.id ? "border-accent bg-accent/15" : "border-line hover:bg-white/5"}`}
                    >
                      <span className="block font-display text-xl">{p.name}</span>
                      <span className="text-xs text-ink-soft">{p.country}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            {step === 1 && (
              <fieldset>
                <legend className="mb-4 text-lg font-semibold">What are you in the mood for? Pick any.</legend>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {VIBES.map((v) => {
                    const on = vibes.includes(v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setVibes((cur) => (on ? cur.filter((x) => x !== v.id) : [...cur, v.id]))}
                        className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${on ? "border-accent bg-accent/15" : "border-line hover:bg-white/5"}`}
                      >
                        <span className="text-2xl" aria-hidden>
                          {v.icon}
                        </span>
                        <span className="font-semibold">{v.label}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
            {step === 2 && (
              <fieldset>
                <legend className="mb-4 text-lg font-semibold">How much energy are you bringing?</legend>
                <div className="grid gap-3 md:grid-cols-3">
                  {ENERGY.map((e) => (
                    <button
                      key={e.v}
                      type="button"
                      aria-pressed={energy === e.v}
                      onClick={() => setEnergy(e.v)}
                      className={`rounded-2xl border p-5 text-left transition ${energy === e.v ? "border-accent bg-accent/15" : "border-line hover:bg-white/5"}`}
                    >
                      <span className="block font-display text-2xl">{e.label}</span>
                      <span className="text-sm text-ink-soft">{e.sub}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            {step === 3 && (
              <div className="grid gap-5 md:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block font-semibold">Group size</span>
                  <input type="number" min={1} max={8} value={guests} onChange={(e) => setGuests(Math.max(1, Math.min(8, Number(e.target.value) || 1)))} className="field" />
                </label>
                <label className="block">
                  <span className="mb-2 block font-semibold">Time you&apos;d like to spend</span>
                  <select value={hours} onChange={(e) => setHours(e.target.value === "" ? "" : Number(e.target.value))} className="field">
                    <option value="">Any length</option>
                    <option value={3}>Up to 3 hours</option>
                    <option value={4}>Up to 4 hours</option>
                    <option value={5}>Up to 5 hours</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block font-semibold">Budget per guest</span>
                  <select value={budget} onChange={(e) => setBudget(e.target.value === "" ? "" : Number(e.target.value))} className="field">
                    <option value="">No limit</option>
                    <option value={75}>Up to $75</option>
                    <option value={100}>Up to $100</option>
                    <option value={130}>Up to $130</option>
                  </select>
                </label>
                {err && <p className="text-warm md:col-span-3">{err}</p>}
              </div>
            )}
            {step === 4 && results && (
              <div>
                {results.length === 0 ? (
                  <div className="py-6">
                    <p className="font-display text-2xl">Hmm, nothing fits all of that.</p>
                    <p className="mt-2 text-ink-soft">I only suggest tours that fit the ship&apos;s schedule and have seats. Try a wider budget, time or another port.</p>
                  </div>
                ) : (
                  <>
                    <p className="mb-5 text-ink-soft">Here&apos;s what I found. Every one fits the ship&apos;s timetable and has seats for {guests}.</p>
                    <div className="grid gap-4 md:grid-cols-3">
                      {results.map((r, i) => {
                        const e = getExcursion(r.excursionId)!;
                        return (
                          <motion.div key={r.excursionId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <TideLink
                              href={`/excursions/${e.id}?guests=${guests}`}
                              onClick={() => track("recommendation.clicked", { excursionId: e.id })}
                              className="group block overflow-hidden rounded-3xl border border-line transition hover:-translate-y-1"
                            >
                              <ExcursionArt art={e.art} className="h-32" />
                              <div className="p-5">
                                <p className="text-xs font-bold tracking-[0.18em] text-ink-soft uppercase">
                                  {getPort(e.portId)?.name} · {fmtDuration(e.durationMin)}
                                </p>
                                <p className="font-display mt-1 text-xl leading-snug">{e.title}</p>
                                <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                                  {r.reasons.map((x) => (
                                    <li key={x}>· {x}</li>
                                  ))}
                                </ul>
                                <p className="mt-4 font-semibold">{fmtUsd(e.priceCents)} / guest</p>
                              </div>
                            </TideLink>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {step > 0 && step < 4 && (
          <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
        )}
        {step < 3 && (
          <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
            Continue
          </button>
        )}
        {step === 3 && (
          <button className="btn btn-primary" onClick={run} disabled={loading}>
            {loading ? "Checking tide tables…" : "Find my matches"}
          </button>
        )}
        {step === 4 && (
          <>
            <button
              className="btn btn-primary"
              onClick={() =>
                openConcierge(
                  `I did Adventure Match: ${portId ? getPort(portId)?.name : "any port"}, I like ${vibes.join(", ") || "anything"}, energy ${energy}/3, ${guests} guests. Which would you pick and why?`,
                )
              }
            >
              Ask Migo to help me choose
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setStep(0);
                setResults(null);
              }}
            >
              Start over
            </button>
          </>
        )}
      </div>
    </div>
  );
}

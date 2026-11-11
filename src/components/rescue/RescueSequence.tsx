"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { getExcursion, getPort } from "@/lib/domain/catalog";
import { fmtMin, fmtUsd, toMin } from "@/lib/domain/time";
import type { RescueProposal } from "@/lib/domain/types";

/**
 * The signature Trip Rescue moment, driven entirely by the real LastBoard
 * result stored on the proposal (no invented numbers):
 *   1. on schedule  →  2. ship slips by the simulated delay  →
 *   3. original tour no longer fits (reason shown)  →  4. top-pick alternative glides in, price change counts.
 */
export function RescueSequence({ rescue }: { rescue: RescueProposal }) {
  const original = getExcursion(rescue.excursionId)!;
  const port = getPort(original.portId)!;
  const pick = rescue.options.find((o) => o.kind === "switch");
  const pickEx = pick?.excursionId ? getExcursion(pick.excursionId) : undefined;
  const t = rescue.original.timeline;
  const scheduledArrive = toMin(port.arrive);
  const delayedArrive = t.shipArrive;

  const lo = Math.min(scheduledArrive, t.departs - original.transferMin) - 40;
  const hi = t.allAboard + 20;
  const pct = (m: number) => `${((Math.max(lo, Math.min(hi, m)) - lo) / (hi - lo)) * 100}%`;
  const wid = (a: number, b: number) => `${((Math.min(hi, b) - Math.max(lo, a)) / (hi - lo)) * 100}%`;

  const [phase, setPhase] = useState(0);
  const [run, setRun] = useState(0);
  const counter = useMotionValue(0);
  const counterText = useTransform(counter, (v) => fmtUsd(Math.round(v)));

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced";
    if (reduced) {
      setPhase(4);
      counter.set(Math.abs(pick?.deltaCents ?? 0));
      return;
    }
    setPhase(0);
    counter.set(0);
    const timers = [setTimeout(() => setPhase(1), 700), setTimeout(() => setPhase(2), 2100), setTimeout(() => setPhase(3), 3500), setTimeout(() => setPhase(4), 4300)];
    const c = setTimeout(() => animate(counter, Math.abs(pick?.deltaCents ?? 0), { duration: 1.2, ease: "easeOut" }), 4500);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(c);
    };
  }, [run, pick?.deltaCents, counter]);

  const ease = [0.65, 0, 0.35, 1] as const;
  const shipStart = phase >= 1 ? delayedArrive : scheduledArrive;
  const pickT = pick?.feasibility?.timeline;

  const caption = [
    `${port.name}: the ship is due at ${fmtMin(scheduledArrive)}. ${original.title} departs ${fmtMin(t.departs)}.`,
    `Simulated delay: the ship now arrives ${fmtMin(delayedArrive)} (+${rescue.delayMin} min).`,
    rescue.original.reasons[0] ?? "The original excursion no longer fits.",
    pickEx ? `LastBoard found ${pickEx.title}, departing ${fmtMin(pickT!.departs)} with ${pick!.feasibility!.slackMin} min margin.` : "No alternative fits; a full refund is offered.",
    pickEx
      ? `${pickEx.title} still fits your port day${pick!.deltaCents < 0 ? ", and costs less, so the difference goes back to your PayPal" : pick!.deltaCents > 0 ? " for a small top-up through PayPal" : " at no extra cost"}. Nothing changes until you approve.`
      : "A full refund to your original PayPal payment is available. Nothing changes until you approve.",
  ][phase];

  return (
    <div className="relative mt-6 overflow-hidden rounded-3xl border border-line bg-black/20 p-5 sm:p-7" aria-live="polite">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="eyebrow">LastBoard replay · {port.name}</p>
        <button className="text-xs text-ink-soft underline-offset-2 hover:underline" onClick={() => setRun((r) => r + 1)}>
          Replay
        </button>
      </div>

      {/* hour ruler */}
      <div className="relative h-5 text-[10px] text-ink-soft">
        {Array.from({ length: Math.ceil((hi - lo) / 60) + 1 }, (_, i) => Math.ceil(lo / 60) * 60 + i * 60)
          .filter((m) => m <= hi)
          .map((m) => (
            <span key={m} className="absolute -translate-x-1/2" style={{ left: pct(m) }}>
              {fmtMin(m).replace(":00", "")}
            </span>
          ))}
      </div>

      <div className="relative mt-2 space-y-3">
        {/* ship row */}
        <p className="text-[10px] font-bold tracking-[0.16em] text-ink-soft uppercase">Ship in port</p>
        <div className="relative h-11 rounded-xl bg-white/5">
          {phase >= 1 && (
            <motion.div
              className="absolute inset-y-1.5 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ left: pct(scheduledArrive), width: wid(scheduledArrive, delayedArrive), background: "repeating-linear-gradient(45deg, color-mix(in oklab, var(--warm) 55%, transparent) 0 6px, transparent 6px 12px)" }}
            />
          )}
          <motion.div
            className="absolute inset-y-1.5 rounded-lg"
            style={{ right: `calc(100% - ${pct(t.allAboard)})`, background: "linear-gradient(90deg, color-mix(in oklab, var(--accent) 55%, transparent), color-mix(in oklab, var(--accent) 25%, transparent))" }}
            initial={false}
            animate={{ left: pct(shipStart) }}
            transition={{ duration: 1.2, ease }}
          />
          <div className="absolute inset-y-0 w-0.5 bg-warm" style={{ left: pct(t.latestBack) }} title="Safety cut-off" />
          {phase >= 1 && (
            <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="demo-tag absolute -top-3" style={{ left: pct(scheduledArrive) }}>
              +{rescue.delayMin} min · simulated
            </motion.span>
          )}
        </div>

        {/* original tour */}
        <div className="relative h-12">
          <motion.div
            className="absolute inset-y-0 flex items-center overflow-hidden rounded-xl px-3 text-xs font-bold"
            style={{ left: pct(t.departs), width: wid(t.departs, t.ends) }}
            initial={false}
            animate={
              phase >= 2
                ? { backgroundColor: "rgba(255,122,89,0.85)", color: "#fff", x: phase === 2 ? [0, -6, 6, -4, 4, 0] : 0, opacity: phase >= 4 ? 0.55 : 1 }
                : { backgroundColor: "rgba(52,214,201,0.8)", color: "#032029", x: 0, opacity: 1 }
            }
            transition={{ duration: 0.6 }}
          >
            <span className="relative z-10 truncate">
              {phase >= 2 ? "✕ " : ""}
              {original.title}
            </span>
          </motion.div>
          {phase >= 2 && (
            <motion.div
              className="absolute -inset-y-1 w-px border-l border-dashed border-ink/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              style={{ left: pct(t.readyAtMeetingPoint) }}
              title={`You'd be ready at ${fmtMin(t.readyAtMeetingPoint)}`}
            />
          )}
        </div>

        {/* alternative */}
        <div className="relative h-12">
          {pickT && pickEx && phase >= 3 && (
            <motion.div
              className="absolute inset-y-0 flex items-center overflow-hidden rounded-xl px-3 text-xs font-bold"
              style={{ left: pct(pickT.departs), width: wid(pickT.departs, pickT.ends), background: "color-mix(in oklab, var(--accent) 85%, transparent)", color: "var(--accent-ink)" }}
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1, boxShadow: phase >= 4 ? "0 0 32px 2px color-mix(in oklab, var(--accent) 60%, transparent)" : "none" }}
              transition={{ duration: 0.8, ease }}
            >
              <span className="truncate">✓ {pickEx.title}</span>
            </motion.div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <motion.p key={phase} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl text-sm leading-relaxed">
          {caption}
        </motion.p>
        {phase >= 4 && pick && pick.deltaCents !== 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-right">
            <p className="eyebrow">{pick.deltaCents < 0 ? "Refund to PayPal" : "Top-up via PayPal"}</p>
            <motion.p className="font-display text-4xl text-accent">{counterText}</motion.p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

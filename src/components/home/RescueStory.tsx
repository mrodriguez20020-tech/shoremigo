"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

/**
 * Illustrative LastBoard timeline using the demo catalog's real numbers
 * (Cozumel: arrive 8:00, all-aboard 17:00; Palancar snorkel 9:15–12:15).
 * Animates a 90-minute simulated delay pushing arrival past the tour start.
 */
const START = 7 * 60; // 7:00
const END = 18 * 60; // 18:00
const pct = (m: number) => ((m - START) / (END - START)) * 100;

export function RescueStory() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const ease = [0.65, 0, 0.35, 1] as const;

  return (
    <div ref={ref} className="surface rounded-[32px] p-6 sm:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">LastBoard · Cozumel · illustration with demo data</p>
        <span className="demo-tag">Simulated delay</span>
      </div>
      {/* hours ruler */}
      <div className="relative h-6 text-[10px] text-ink-soft">
        {Array.from({ length: 12 }, (_, i) => START + i * 60).map((m) => (
          <span key={m} className="absolute -translate-x-1/2" style={{ left: `${pct(m)}%` }}>
            {((m / 60 + 11) % 12) + 1}
            {m < 720 ? "a" : "p"}
          </span>
        ))}
      </div>
      <div className="relative mt-2 space-y-4">
        {/* ship row */}
        <div className="relative h-12 rounded-2xl bg-white/5">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-soft">Ship in port</span>
          <motion.div
            className="absolute inset-y-1.5 rounded-xl"
            style={{ right: `${100 - pct(17 * 60)}%`, background: "linear-gradient(90deg, color-mix(in oklab, var(--accent) 50%, transparent), color-mix(in oklab, var(--accent) 25%, transparent))" }}
            initial={{ left: `${pct(8 * 60)}%` }}
            animate={inView ? { left: `${pct(9.5 * 60)}%` } : {}}
            transition={{ delay: 1, duration: 1.4, ease }}
          />
          <div className="absolute inset-y-0 w-px bg-warm" style={{ left: `${pct(16 * 60)}%` }} title="Safety cut-off" />
        </div>
        {/* original tour */}
        <div className="relative h-14">
          <motion.div
            className="absolute inset-y-0 flex items-center rounded-xl px-3 text-xs font-bold"
            style={{ left: `${pct(9 * 60 + 15)}%`, width: `${pct(12 * 60 + 35) - pct(9 * 60 + 15)}%` }}
            initial={{ background: "color-mix(in oklab, var(--accent) 70%, transparent)", color: "var(--accent-ink)" }}
            animate={inView ? { background: "color-mix(in oklab, var(--warm) 75%, transparent)", color: "#fff", x: [0, -4, 4, -2, 0] } : {}}
            transition={{ delay: 2.4, duration: 0.6 }}
          >
            Palancar Reef 9:15
          </motion.div>
          <motion.span
            className="absolute -bottom-5 text-[11px] font-semibold text-warm"
            style={{ left: `${pct(9 * 60 + 15)}%` }}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 2.7 }}
          >
            Ready at 10:20, but it departs 9:15. Infeasible.
          </motion.span>
        </div>
        {/* alternative */}
        <div className="relative h-14 pt-3">
          <motion.div
            className="absolute inset-y-3 flex items-center rounded-xl px-3 text-xs font-bold"
            style={{
              left: `${pct(12 * 60 + 45)}%`,
              width: `${pct(15 * 60 + 30) - pct(12 * 60 + 45)}%`,
              background: "color-mix(in oklab, var(--accent) 80%, transparent)",
              color: "var(--accent-ink)",
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 3.4, duration: 0.7, ease }}
          >
            Afternoon Reef 1:00 ✓
          </motion.div>
        </div>
      </div>
      <ol className="mt-10 grid gap-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Delay detected", "A clearly labeled demo control shifts the ship's arrival."],
          ["LastBoard recalculates", "Deterministic rules: disembark, transfers, duration, 60-min return buffer."],
          ["Migo explains", "The AI explains the conflict using the engine's numbers, not guesses."],
          ["Operator reviews", "Guides, vehicles and seats checked before options are released."],
          ["You approve", "Nothing changes until you choose: switch or full refund."],
          ["PayPal verified", "Refund or top-up runs through PayPal; we show its real status."],
        ].map(([t, d], i) => (
          <motion.li key={t} initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 3.8 + i * 0.12 }}>
            <span className="font-display text-3xl text-accent">{String(i + 1).padStart(2, "0")}</span>
            <p className="mt-1 font-semibold">{t}</p>
            <p className="mt-1 text-ink-soft">{d}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

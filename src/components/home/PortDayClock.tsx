"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { POLICY, excursionsForPort, getPort } from "@/lib/domain/catalog";
import { checkFeasibility } from "@/lib/domain/feasibility";
import { fmtMin, toMin } from "@/lib/domain/time";

/**
 * Hero explainer: the product in five seconds. Runs the real LastBoard engine
 * in the browser on the demo Cozumel port call, on time vs. a simulated
 * 90-minute delay. Auto-cycles until the visitor takes control.
 */
const PORT = "cozumel";
const DELAY = 90;

export function PortDayClock() {
  const port = getPort(PORT)!;
  const tours = excursionsForPort(PORT);
  const [late, setLate] = useState(false);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setLate((l) => !l), late ? 5200 : 3800);
    return () => clearInterval(t);
  }, [auto, late]);

  const rows = useMemo(
    () => tours.map((e) => ({ e, f: checkFeasibility(port, e, POLICY, { delayMin: late ? DELAY : 0 }) })),
    [tours, port, late],
  );

  const lo = 7 * 60;
  const hi = 18 * 60;
  const pct = (m: number) => `${((Math.max(lo, Math.min(hi, m)) - lo) / (hi - lo)) * 100}%`;
  const wid = (a: number, b: number) => `${((Math.min(hi, b) - Math.max(lo, a)) / (hi - lo)) * 100}%`;
  const arrive = toMin(port.arrive) + (late ? DELAY : 0);
  const allAboard = toMin(port.allAboard);
  const ease = [0.65, 0, 0.35, 1] as const;

  return (
    <div className="surface-strong rounded-[28px] p-5 sm:p-6" aria-label="LastBoard port-day example" data-migo-avoid>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">LastBoard · live engine</p>
          <p className="font-display mt-1 text-xl">Cozumel port day</p>
        </div>
        <div className="flex w-fit shrink-0 whitespace-nowrap rounded-full bg-white/10 p-1 text-[11px] font-bold" role="group" aria-label="Ship timing">
          {[
            { v: false, l: "On time" },
            { v: true, l: `+${DELAY} min late` },
          ].map((o) => (
            <button
              key={String(o.v)}
              onClick={() => {
                setAuto(false);
                setLate(o.v);
              }}
              aria-pressed={late === o.v}
              className={`rounded-full px-3 py-1.5 transition ${late === o.v ? (o.v ? "bg-warm text-white" : "bg-accent text-accent-ink") : "text-ink-soft"}`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-5 h-4 text-[9px] text-ink-soft">
        {[8, 10, 12, 14, 16].map((h) => (
          <span key={h} className="absolute -translate-x-1/2" style={{ left: pct(h * 60) }}>
            {fmtMin(h * 60).replace(":00", "")}
          </span>
        ))}
      </div>

      {/* ship */}
      <div className="relative mt-1 h-8 rounded-lg bg-white/5">
        {late && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-y-1 rounded-md"
            style={{ left: pct(toMin(port.arrive)), width: wid(toMin(port.arrive), arrive), background: "repeating-linear-gradient(45deg, color-mix(in oklab, var(--warm) 55%, transparent) 0 5px, transparent 5px 10px)" }}
          />
        )}
        <motion.div
          className="absolute inset-y-1 flex items-center rounded-md px-2 text-[10px] font-bold"
          style={{ right: `calc(100% - ${pct(allAboard)})`, background: "color-mix(in oklab, var(--accent) 45%, transparent)" }}
          initial={false}
          animate={{ left: pct(arrive) }}
          transition={{ duration: 1, ease }}
        >
          🚢 {fmtMin(arrive)} → all aboard {fmtMin(allAboard)}
        </motion.div>
      </div>

      <ul className="mt-2 space-y-1.5">
        {rows.map(({ e, f }) => {
          const bad = f.status === "infeasible";
          return (
            <li key={e.id} className="relative h-8">
              <motion.div
                className="absolute inset-y-0 flex items-center overflow-hidden rounded-md px-2 text-[10.5px] font-semibold"
                initial={false}
                animate={{
                  left: pct(f.timeline.departs),
                  width: wid(f.timeline.departs, f.timeline.ends),
                  backgroundColor: bad ? "rgba(255,122,89,0.8)" : f.status === "tight" ? "rgba(243,196,99,0.85)" : "rgba(52,214,201,0.8)",
                  x: bad && late ? [0, -4, 4, 0] : 0,
                }}
                transition={{ duration: 0.8, ease }}
                style={{ color: bad ? "#fff" : "#032029" }}
                title={f.reasons[0]}
              >
                <span className="truncate">
                  {bad ? "✕ " : "✓ "}
                  {e.title}
                </span>
              </motion.div>
            </li>
          );
        })}
      </ul>

      <motion.p key={String(late)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-xs leading-relaxed text-ink-soft">
        {late
          ? `Ship ${DELAY} min late (simulated): ${rows.filter((r) => r.f.status === "infeasible").length} tour no longer fits. Trip Rescue offers the ones that still do, and refunds the difference through PayPal.`
          : "Every tour is checked against arrival, disembark time, transfers and a 60-minute return buffer before you can book."}
      </motion.p>
    </div>
  );
}

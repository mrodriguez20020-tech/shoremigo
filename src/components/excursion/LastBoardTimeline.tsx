import { fmtMin } from "@/lib/domain/time";
import type { Feasibility } from "@/lib/domain/types";

/** Visual explanation of a LastBoard feasibility result. Presentational only. */
export function LastBoardTimeline({ f, compact = false, label }: { f: Feasibility; compact?: boolean; label?: string }) {
  const t = f.timeline;
  const lo = Math.min(t.shipArrive, t.departs) - 30;
  const hi = t.allAboard + 20;
  const p = (m: number) => `${((Math.max(lo, Math.min(hi, m)) - lo) / (hi - lo)) * 100}%`;
  const w = (a: number, b: number) => `${(Math.max(0, Math.min(hi, b) - Math.max(lo, a)) / (hi - lo)) * 100}%`;
  const statusColor = f.status === "ok" ? "var(--accent)" : f.status === "tight" ? "#f3c463" : "var(--warm)";

  return (
    <figure className="w-full" aria-label={label ?? "LastBoard schedule check"}>
      {!compact && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <figcaption className="eyebrow">LastBoard schedule check</figcaption>
          <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: `color-mix(in oklab, ${statusColor} 22%, transparent)`, color: statusColor }}>
            {f.status === "ok" ? "Fits comfortably" : f.status === "tight" ? "Fits, tight margin" : "Doesn't fit"}
          </span>
        </div>
      )}
      <div className={`relative ${compact ? "h-7" : "h-12"} rounded-xl bg-white/5`}>
        {/* safety buffer zone */}
        <div
          className="absolute inset-y-0 rounded-r-xl"
          style={{ left: p(t.latestBack), width: w(t.latestBack, t.allAboard), background: "repeating-linear-gradient(45deg, color-mix(in oklab, var(--warm) 30%, transparent) 0 6px, transparent 6px 12px)" }}
          title="Safety buffer before all-aboard"
        />
        {/* getting there */}
        <div className="absolute inset-y-2 rounded-md bg-white/20" style={{ left: p(t.shipArrive), width: w(t.shipArrive, t.readyAtMeetingPoint) }} title="Disembark + transfer" />
        {/* tour */}
        <div className="absolute inset-y-1 rounded-md" style={{ left: p(t.departs), width: w(t.departs, t.ends), background: statusColor }} title="Excursion" />
        {/* return */}
        <div className="absolute inset-y-2 rounded-md bg-white/30" style={{ left: p(t.ends), width: w(t.ends, t.backAtPier) }} title="Return transfer" />
        {/* markers */}
        <div className="absolute inset-y-[-4px] w-0.5 bg-ink" style={{ left: p(t.shipArrive) }} title="Ship arrives" />
        <div className="absolute inset-y-[-4px] w-0.5 bg-warm" style={{ left: p(t.allAboard) }} title="All aboard" />
      </div>
      {!compact && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink-soft sm:grid-cols-4">
          <div>
            <dt className="inline">Ship arrives </dt>
            <dd className="inline font-semibold text-ink">{fmtMin(t.shipArrive)}</dd>
          </div>
          <div>
            <dt className="inline">Tour departs </dt>
            <dd className="inline font-semibold text-ink">{fmtMin(t.departs)}</dd>
          </div>
          <div>
            <dt className="inline">Back at pier </dt>
            <dd className="inline font-semibold text-ink">{fmtMin(t.backAtPier)}</dd>
          </div>
          <div>
            <dt className="inline">All aboard </dt>
            <dd className="inline font-semibold text-ink">{fmtMin(t.allAboard)}</dd>
          </div>
        </dl>
      )}
      {!compact && (
        <ul className="mt-3 space-y-1 text-sm">
          {f.reasons.map((r) => (
            <li key={r} className="text-ink-soft">
              {r}
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}

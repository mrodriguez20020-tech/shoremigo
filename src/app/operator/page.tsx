"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GUIDES, PORTS, VEHICLES, getExcursion, getPort } from "@/lib/domain/catalog";
import { buildSchedule, resourceClashes } from "@/lib/domain/schedule";
import { fmtMin, fmtUsd } from "@/lib/domain/time";
import type { AuditEvent, Booking, Disruption, RescueProposal } from "@/lib/domain/types";
import { SceneRoute } from "@/components/scene/SceneProvider";
import { api } from "@/lib/client/track";
import { migo } from "@/components/migo/bus";

interface Overview {
  bookings: Booking[];
  rescues: RescueProposal[];
  disruptions: Disruption[];
  audit: AuditEvent[];
  engagement: Record<string, number>;
  inventory: { excursionId: string; capacity: number; seatsLeft: number }[];
  protected: boolean;
}

type Tab = "schedule" | "rescue" | "bookings" | "audit" | "insights";

export default function OperatorPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [needAuth, setNeedAuth] = useState(false);
  const [tab, setTab] = useState<Tab>("schedule");
  const [port, setPort] = useState("cozumel");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api<Overview>("/api/operator/overview"));
      setNeedAuth(false);
    } catch (e) {
      if ((e as { status?: number }).status === 401) setNeedAuth(true);
      else setErr((e as Error).message);
    }
  }, []);

  useEffect(() => {
    migo.emit({ type: "dock:request" });
    return () => migo.emit({ type: "dock:release" });
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const pendingReviews = data?.rescues.filter((r) => r.status === "open" && r.operatorReview === "pending").length ?? 0;
  useEffect(() => {
    if (pendingReviews > 0) setTab((t) => (t === "schedule" ? "rescue" : t));
  }, [pendingReviews]);

  if (needAuth) return <Passcode onDone={load} />;

  return (
    <>
      <SceneRoute scene="night" />
      <section className="px-4 pb-40 pt-28 sm:px-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Operator console · demo operator &ldquo;Tidewalk Tours&rdquo;</p>
              <h1 className="font-display mt-2 text-4xl sm:text-5xl">Today&apos;s operations</h1>
            </div>
            {data && !data.protected && <p className="max-w-md text-xs text-ink-soft">Demo mode: this console is unprotected. Set OPERATOR_PASSCODE to require a passcode.</p>}
          </div>
          {err && <p className="mt-4 text-warm">{err}</p>}

          {data && <Kpis data={data} />}
          {data && <DisruptionBar data={data} reload={load} />}

          <div className="mt-8 flex flex-wrap gap-2" role="tablist">
            {(
              [
                ["schedule", "Schedule"],
                ["rescue", `Trip Rescue reviews${pendingReviews ? ` (${pendingReviews})` : ""}`],
                ["bookings", "Bookings & payments"],
                ["audit", "Audit trail"],
                ["insights", "Engagement"],
              ] as [Tab, string][]
            ).map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`btn !py-2 text-sm ${tab === id ? "btn-primary" : "btn-ghost"}`}>
                {label}
              </button>
            ))}
          </div>

          {!data ? (
            <div className="surface mt-6 h-96 animate-pulse rounded-[28px]" />
          ) : (
            <div className="mt-6">
              {tab === "schedule" && <ScheduleView data={data} port={port} setPort={setPort} />}
              {tab === "rescue" && <RescueReviews data={data} reload={load} />}
              {tab === "bookings" && <BookingsView data={data} />}
              {tab === "audit" && <AuditView data={data} />}
              {tab === "insights" && <Insights data={data} />}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function Passcode({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <section className="px-5 pb-40 pt-32">
      <SceneRoute scene="night" />
      <form
        className="surface mx-auto grid max-w-sm gap-4 rounded-[28px] p-8"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/api/operator/login", { json: { passcode: code } });
            onDone();
          } catch (x) {
            setErr((x as Error).message);
          }
        }}
      >
        <h1 className="font-display text-3xl">Operator access</h1>
        <input type="password" className="field" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Passcode" aria-label="Operator passcode" />
        {err && <p className="text-sm text-warm">{err}</p>}
        <button className="btn btn-primary">Enter</button>
      </form>
    </section>
  );
}

function DisruptionBar({ data, reload }: { data: Overview; reload: () => void }) {
  const [delay, setDelay] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);
  return (
    <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {PORTS.map((p) => {
        const d = data.disruptions.find((x) => x.portId === p.id);
        return (
          <div key={p.id} className={`surface rounded-2xl p-4 ${d ? "ring-1 ring-warm" : ""}`}>
            <div className="flex items-center justify-between">
              <p className="font-semibold">{p.name}</p>
              {d ? <span className="demo-tag">Simulated +{d.delayMin}m</span> : <span className="text-xs text-ink-soft">On schedule</span>}
            </div>
            <div className="mt-3 flex gap-2">
              <select
                className="field !py-2 text-sm"
                value={delay[p.id] ?? 90}
                onChange={(e) => setDelay({ ...delay, [p.id]: Number(e.target.value) })}
                aria-label={`Delay for ${p.name}`}
              >
                {[45, 90, 120, 180].map((m) => (
                  <option key={m} value={m}>
                    +{m} min
                  </option>
                ))}
              </select>
              <button
                className="btn btn-ghost !py-2 text-xs"
                disabled={busy === p.id}
                onClick={async () => {
                  setBusy(p.id);
                  await api("/api/operator/disruption", { json: { portId: p.id, delayMin: delay[p.id] ?? 90 } }).catch(() => {});
                  setBusy(null);
                  reload();
                }}
              >
                Simulate
              </button>
              {d && (
                <button
                  className="btn btn-ghost !py-2 text-xs"
                  onClick={async () => {
                    await api(`/api/operator/disruption?portId=${p.id}`, { method: "DELETE" });
                    reload();
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const AX_START = 6 * 60;
const AX_END = 22 * 60;
const px = (m: number) => `${((Math.max(AX_START, Math.min(AX_END, m)) - AX_START) / (AX_END - AX_START)) * 100}%`;
const pw = (a: number, b: number) => `${((Math.min(AX_END, b) - Math.max(AX_START, a)) / (AX_END - AX_START)) * 100}%`;

function ScheduleView({ data, port, setPort }: { data: Overview; port: string; setPort: (p: string) => void }) {
  const booked = useMemo(() => Object.fromEntries(data.inventory.map((i) => [i.excursionId, i.capacity - i.seatsLeft])), [data.inventory]);
  const sched = useMemo(() => buildSchedule(port, booked, data.disruptions.find((d) => d.portId === port)), [port, booked, data.disruptions]);
  const clashes = resourceClashes(sched);
  const p = getPort(port)!;

  return (
    <div className="surface rounded-[28px] p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {PORTS.map((x) => (
            <button key={x.id} onClick={() => setPort(x.id)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${port === x.id ? "bg-white/15" : "text-ink-soft"}`}>
              {x.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-soft">
          {p.date} · guides & vehicles · live from bookings{sched.delayMin ? ` · simulated +${sched.delayMin} min arrival` : ""}
        </p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[900px]">
          {/* axis */}
          <div className="relative ml-40 h-6 text-[10px] text-ink-soft">
            {Array.from({ length: 17 }, (_, i) => AX_START + i * 60).map((m) => (
              <span key={m} className="absolute -translate-x-1/2" style={{ left: px(m) }}>
                {fmtMin(m).replace(":00", "")}
              </span>
            ))}
          </div>
          {/* ship row */}
          <Row label="Ship in port" sub={p.tender ? "tender" : "pier"}>
            {sched.delayMin > 0 && (
              <div
                className="absolute inset-y-2 rounded-md"
                style={{ left: px(sched.scheduledArriveMin), width: pw(sched.scheduledArriveMin, sched.arriveMin), background: "repeating-linear-gradient(45deg, color-mix(in oklab, var(--warm) 45%, transparent) 0 6px, transparent 6px 12px)" }}
                title="Lost to simulated delay"
              />
            )}
            <div className="absolute inset-y-2 rounded-md bg-accent/40" style={{ left: px(sched.arriveMin), width: pw(sched.arriveMin, sched.allAboardMin) }} />
          </Row>
          {sched.resources.map((r) => (
            <Row key={r.id} label={r.name} sub={r.kind === "guide" ? `Guide · ${GUIDES[r.id]?.languages.join("/")}` : `Vehicle · ${VEHICLES[r.id]?.seats} seats`}>
              {sched.events
                .filter((e) => e.resourceIds.includes(r.id))
                .map((e) => {
                  const clash = clashes.some((c) => c.resourceId === r.id && (c.a === e.id || c.b === e.id));
                  const bg =
                    e.status === "infeasible"
                      ? e.conflict
                        ? "color-mix(in oklab, var(--warm) 80%, transparent)"
                        : "rgba(255,255,255,0.08)"
                      : e.booked > 0
                        ? "color-mix(in oklab, var(--accent) 75%, transparent)"
                        : "color-mix(in oklab, var(--accent) 25%, transparent)";
                  return (
                    <div
                      key={e.id}
                      className={`absolute inset-y-1.5 overflow-hidden rounded-lg px-2 py-1 text-[11px] leading-tight ${clash ? "ring-2 ring-[#ffd27a]" : ""}`}
                      style={{ left: px(e.startMin), width: pw(e.startMin, e.endMin), background: bg, color: e.booked > 0 || e.conflict ? "var(--accent-ink)" : "var(--ink)" }}
                      title={`${e.name} · ${fmtMin(e.startMin)}–${fmtMin(e.endMin)} · ${e.booked}/${e.capacity} booked · ${e.status}`}
                    >
                      <span className="block truncate font-bold">{e.name}</span>
                      <span className="block truncate">
                        {e.booked}/{e.capacity} · {e.conflict ? "CONFLICT" : e.status === "infeasible" ? "won't run" : e.status}
                      </span>
                    </div>
                  );
                })}
            </Row>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-soft">
        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded bg-accent/75 align-middle" />
          Booked run
        </span>
        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded align-middle" style={{ background: "var(--warm)" }} />
          Conflict: guests booked on a run that no longer fits
        </span>
        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded ring-2 ring-[#ffd27a] align-middle" />
          Resource double-booked
        </span>
        <span>Safety cut-off {fmtMin(sched.latestBackMin)}</span>
      </div>
      <p className="mt-3 text-[11px] text-ink-soft">
        In-house timeline built on a Bryntum-compatible resources/events model (lib/domain/schedule.ts). Bryntum Scheduler can replace this view once a licensed package is installed.
      </p>
    </div>
  );
}

function Row({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex items-stretch border-t border-line">
      <div className="w-40 shrink-0 py-2 pr-3">
        <p className="truncate text-sm font-semibold">{label}</p>
        <p className="truncate text-[11px] text-ink-soft">{sub}</p>
      </div>
      <div className="relative h-14 flex-1">
        {Array.from({ length: 16 }, (_, i) => (
          <div key={i} className="absolute inset-y-0 w-px bg-white/5" style={{ left: px(AX_START + (i + 1) * 60) }} />
        ))}
        {children}
      </div>
    </div>
  );
}

function RescueReviews({ data, reload }: { data: Overview; reload: () => void }) {
  const open = data.rescues.filter((r) => r.status === "open" || r.status === "awaiting_payment");
  const [note, setNote] = useState<Record<string, string>>({});
  if (!open.length) return <p className="surface rounded-[28px] p-8 text-ink-soft">No open Trip Rescue proposals. Simulate a delay at a port with bookings to create one.</p>;
  return (
    <div className="grid gap-4">
      {open.map((r) => {
        const b = data.bookings.find((x) => x.id === r.bookingId);
        const inv = (id: string) => data.inventory.find((i) => i.excursionId === id);
        return (
          <div key={r.id} className="surface rounded-[28px] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">
                  {b?.ref} · {b?.firstName} {b?.lastName} · {b?.guests} guests
                </p>
                <p className="font-display mt-1 text-2xl">{getExcursion(r.excursionId)?.title} no longer fits (+{r.delayMin} min)</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                {r.status === "awaiting_payment" ? "Customer paying top-up" : r.operatorReview === "pending" ? "Awaiting your review" : "Released to customer"}
              </span>
            </div>
            <table className="mt-5 w-full text-left text-sm">
              <thead className="text-xs text-ink-soft">
                <tr>
                  <th className="py-2">Option</th>
                  <th>Guide / vehicle</th>
                  <th>Seats after</th>
                  <th>Price change</th>
                </tr>
              </thead>
              <tbody>
                {r.options.map((o) => {
                  const e = o.excursionId ? getExcursion(o.excursionId) : undefined;
                  const i = o.excursionId ? inv(o.excursionId) : undefined;
                  return (
                    <tr key={o.id} className="border-t border-line">
                      <td className="py-2 font-semibold">{e ? e.title : "Cancel + full refund"}</td>
                      <td>{e ? `${GUIDES[e.guideId]?.name} / ${VEHICLES[e.vehicleId]?.name}` : "—"}</td>
                      <td>{i && b ? `${i.seatsLeft - b.guests} of ${i.capacity}` : "—"}</td>
                      <td>{o.deltaCents === 0 ? "none" : o.deltaCents < 0 ? `refund ${fmtUsd(-o.deltaCents)}` : `+${fmtUsd(o.deltaCents)}`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {r.operatorReview === "pending" && r.status === "open" && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <input className="field max-w-md !py-2 text-sm" placeholder="Note to customer (optional)" value={note[r.id] ?? ""} onChange={(e) => setNote({ ...note, [r.id]: e.target.value })} />
                <button
                  className="btn btn-primary !py-2 text-sm"
                  onClick={async () => {
                    await api("/api/operator/rescue", { json: { proposalId: r.id, decision: "approved", note: note[r.id] } });
                    reload();
                  }}
                >
                  Approve & release options
                </button>
                <button
                  className="btn btn-ghost !py-2 text-sm"
                  onClick={async () => {
                    await api("/api/operator/rescue", { json: { proposalId: r.id, decision: "rejected", note: note[r.id] || "Alternatives unavailable; full refund offered." } });
                    reload();
                  }}
                >
                  Reject switches (refund only)
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BookingsView({ data }: { data: Overview }) {
  const [verify, setVerify] = useState<Record<string, string>>({});
  if (!data.bookings.length) return <p className="surface rounded-[28px] p-8 text-ink-soft">No bookings yet.</p>;
  return (
    <div className="surface overflow-x-auto rounded-[28px] p-4 sm:p-6">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="text-xs text-ink-soft">
          <tr>
            <th className="py-2">Ref</th>
            <th>Guest</th>
            <th>Excursion</th>
            <th>Status</th>
            <th>Total</th>
            <th>Net paid</th>
            <th>PayPal records</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.bookings.map((b) => (
            <tr key={b.id} className="border-t border-line align-top">
              <td className="py-3 font-mono text-xs">{b.ref}</td>
              <td>
                {b.firstName} {b.lastName}
                <span className="block text-xs text-ink-soft">{b.guests} guests</span>
              </td>
              <td>{getExcursion(b.excursionId)?.title}</td>
              <td>{b.status.replace("_", " ")}</td>
              <td>{fmtUsd(b.totalCents)}</td>
              <td>{fmtUsd(b.paidCents)}</td>
              <td className="text-xs">
                {b.payments.map((p, i) => (
                  <span key={i} className="block">
                    {p.kind} {fmtUsd(p.amountCents)} · {p.status} · …{(p.refundId ?? p.captureId ?? "").slice(-8)}
                  </span>
                ))}
                {verify[b.id] && <span className="mt-1 block text-accent">{verify[b.id]}</span>}
              </td>
              <td>
                {b.payments.some((p) => p.captureId) && (
                  <button
                    className="btn btn-ghost !px-3 !py-1.5 text-xs"
                    onClick={async () => {
                      try {
                        const r = await api<{ results: { captureId: string; paypal: string; amountMatches: boolean }[] }>("/api/operator/reverify", { json: { bookingId: b.id } });
                        setVerify({ ...verify, [b.id]: r.results.map((x) => `PayPal says ${x.paypal}${x.amountMatches ? ", amount matches" : ", AMOUNT MISMATCH"}`).join("; ") });
                      } catch (e) {
                        setVerify({ ...verify, [b.id]: (e as Error).message });
                      }
                    }}
                  >
                    Re-verify with PayPal
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditView({ data }: { data: Overview }) {
  const refOf = (id?: string) => data.bookings.find((b) => b.id === id)?.ref ?? "";
  return (
    <div className="surface rounded-[28px] p-4 sm:p-6">
      <ol className="space-y-2 font-mono text-xs">
        {data.audit.map((a) => (
          <li key={a.id} className="grid grid-cols-[150px_80px_220px_90px_1fr] gap-3 border-t border-line pt-2 max-md:grid-cols-1">
            <span className="text-ink-soft">{new Date(a.at).toLocaleTimeString()}</span>
            <span className={a.actor === "paypal" ? "text-accent" : ""}>{a.actor}</span>
            <span className="font-bold">{a.type}</span>
            <span>{refOf(a.bookingId)}</span>
            <span className="truncate text-ink-soft" title={JSON.stringify(a.detail)}>
              {JSON.stringify(a.detail)}
            </span>
          </li>
        ))}
        {!data.audit.length && <li className="text-ink-soft">No events yet.</li>}
      </ol>
    </div>
  );
}

function Insights({ data }: { data: Overview }) {
  const entries = Object.entries(data.engagement).sort((a, b) => b[1] - a[1]);
  return (
    <div className="surface rounded-[28px] p-6">
      <p className="text-sm text-ink-soft">Anonymous event counts (no names, emails, cookies or free text are collected).</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {entries.map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-line p-4">
            <p className="font-display text-3xl">{v}</p>
            <p className="text-xs text-ink-soft">{k}</p>
          </div>
        ))}
        {!entries.length && <p className="text-ink-soft">No events yet.</p>}
      </div>
    </div>
  );
}

function Kpis({ data }: { data: Overview }) {
  const live = data.bookings.filter((b) => b.status === "confirmed" || b.status === "rebooked" || b.status === "disrupted");
  const pays = data.bookings.flatMap((b) => b.payments);
  const captured = pays.filter((p) => p.kind === "charge" && p.status === "COMPLETED").reduce((n, p) => n + p.amountCents, 0);
  const refunded = pays.filter((p) => p.kind === "refund").reduce((n, p) => n + p.amountCents, 0);
  const resolved = data.rescues.filter((r) => r.status === "resolved").length;
  const open = data.rescues.filter((r) => r.status === "open" || r.status === "awaiting_payment").length;
  const items: [string, string, string?][] = [
    ["Active bookings", String(live.length), `${live.reduce((n, b) => n + b.guests, 0)} guests`],
    ["Captured via PayPal", fmtUsd(captured), "COMPLETED captures"],
    ["Refunded via PayPal", fmtUsd(refunded), `${pays.filter((p) => p.kind === "refund").length} refunds`],
    ["Net revenue", fmtUsd(captured - refunded), "sandbox"],
    ["Trip Rescues", `${resolved} resolved`, open ? `${open} open` : "none open"],
  ];
  return (
    <div className="mt-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {items.map(([k, v, sub], i) => (
          <motion.div
            key={k}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`surface rounded-2xl p-4 ${i === 4 && open ? "ring-1 ring-warm" : ""}`}
          >
            <p className="text-[10px] font-bold tracking-[0.18em] text-ink-soft uppercase">{k}</p>
            <p className="font-display mt-1 text-2xl sm:text-3xl">{v}</p>
            {sub && <p className="mt-0.5 text-[11px] text-ink-soft">{sub}</p>}
          </motion.div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-ink-soft">Totals computed from PayPal-verified payment records (sandbox). No real money.</p>
    </div>
  );
}

"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { POLICY, getExcursion, getPort } from "@/lib/domain/catalog";
import { checkFeasibility } from "@/lib/domain/feasibility";
import { fmtUsd } from "@/lib/domain/time";
import type { Disruption, RescueProposal } from "@/lib/domain/types";
import { SceneRoute } from "@/components/scene/SceneProvider";
import { migo } from "@/components/migo/bus";
import { useCompanion } from "@/components/migo/CompanionProvider";
import { LastBoardTimeline } from "@/components/excursion/LastBoardTimeline";
import { ExcursionArt } from "@/components/excursion/ExcursionArt";
import { PayPalButtons } from "@/components/checkout/PayPalButtons";
import { RescueSequence } from "@/components/rescue/RescueSequence";
import { BoardingPass } from "@/components/trip/BoardingPass";
import { TideLink } from "@/components/transition/TideTransition";
import { api, track } from "@/lib/client/track";
import { recordProof } from "@/lib/client/proof";

interface Payment {
  kind: "charge" | "refund";
  amountCents: number;
  status: string;
  purpose: string;
  verifiedAt: string;
  ref: string;
}
interface Booking {
  id: string;
  ref: string;
  status: string;
  firstName: string;
  guests: number;
  excursionId: string;
  originalExcursionId: string;
  totalCents: number;
  paidCents: number;
  payments: Payment[];
}
interface TripState {
  verified: boolean;
  booking?: Booking;
  rescue?: RescueProposal | null;
  disruption?: Disruption | null;
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  disrupted: "Needs attention",
  rebooked: "Rebooked",
  cancelled_refunded: "Cancelled · refunded",
};

export default function TripPage() {
  const [trip, setTrip] = useState<TripState | null>(null);
  const [justConfirmed, setJustConfirmed] = useState(false);

  const load = useCallback(async () => {
    const t = await api<TripState>("/api/trip");
    setTrip(t);
    return t;
  }, []);

  useEffect(() => {
    setJustConfirmed(new URLSearchParams(window.location.search).get("confirmed") === "1");
    load().catch(() => setTrip({ verified: false }));
  }, [load]);

  const scene = !trip?.verified ? "day" : trip.booking?.status === "disrupted" ? "night" : "sunset";

  return (
    <>
      <SceneRoute scene={scene} />
      <section className="px-5 pb-40 pt-28 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="surface flex flex-wrap items-center justify-between gap-5 rounded-3xl p-6" data-migo-avoid>
            <div><p className="eyebrow">Plan before you reserve</p><p className="mt-2 text-ink-soft">Build a port day with several experiences. Check transfers and LastBoard before individual checkout.</p></div>
            <TideLink href="/trip/plan" className="btn-primary">Plan my port day →</TideLink>
          </div>
          {!trip && <div className="surface mt-8 h-80 animate-pulse rounded-[28px]" aria-label="Loading your trip" />}
          {trip && !trip.verified && <VerifyForm onDone={load} />}
          {trip?.verified && trip.booking && <TripView trip={trip} reload={load} justConfirmed={justConfirmed} />}
        </div>
      </section>
    </>
  );
}

function VerifyForm({ onDone }: { onDone: () => void }) {
  const [ref, setRef] = useState("");
  const [last, setLast] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="mx-auto max-w-xl pt-10">
      <p className="eyebrow">My trip</p>
      <h1 className="font-display mt-2 text-5xl">Find your booking</h1>
      <p className="mt-3 text-ink-soft">Enter your booking reference and last name. We use these to keep your booking and payment details private.</p>
      <form
        className="surface mt-8 grid gap-4 rounded-[28px] p-6 sm:p-8"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          try {
            await api("/api/trip/verify", { json: { ref, lastName: last } });
            onDone();
          } catch (x) {
            setErr((x as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">Booking reference</span>
          <input className="field uppercase" placeholder="SM-XXXXX" value={ref} onChange={(e) => setRef(e.target.value)} required />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">Last name</span>
          <input className="field" value={last} onChange={(e) => setLast(e.target.value)} required autoComplete="family-name" />
        </label>
        {err && (
          <p className="text-sm text-warm" role="alert">
            {err}
          </p>
        )}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Checking…" : "View my trip"}
        </button>
      </form>
    </div>
  );
}

function TripView({ trip, reload, justConfirmed }: { trip: TripState; reload: () => Promise<TripState>; justConfirmed: boolean }) {
  const b = trip.booking!;
  const ex = getExcursion(b.excursionId)!;
  const port = getPort(ex.portId)!;
  const f = checkFeasibility(port, ex, POLICY, { delayMin: trip.disruption?.delayMin ?? 0, allAboardExtensionMin: trip.disruption?.allAboardExtensionMin });
  const canSimulate = (b.status === "confirmed" || b.status === "rebooked") && !trip.rescue;
  // Keep the panel mounted after resolution so the outcome stays visible; re-key on a new proposal.
  const [shownRescue, setShownRescue] = useState<RescueProposal | null>(trip.rescue ?? null);
  useEffect(() => {
    if (trip.rescue) setShownRescue(trip.rescue);
  }, [trip.rescue]);

  return (
    <div>
      <AnimatePresence>
        {justConfirmed && b.status === "confirmed" && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }} className="mb-10 pt-6 text-center">
            <p className="eyebrow">Payment verified with PayPal</p>
            <h1 className="font-display mt-3 text-[clamp(2.8rem,7vw,6rem)] leading-[0.95] [text-shadow:0_4px_60px_rgba(80,20,40,0.45)]">
              You&apos;re going to {port.name}, {b.firstName}.
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">My trip · {b.ref}</p>
          {!justConfirmed && <h1 className="font-display mt-2 text-5xl">{ex.title}</h1>}
        </div>
        <span
          className="rounded-full px-4 py-2 text-sm font-bold"
          style={{ background: b.status === "disrupted" ? "color-mix(in oklab, var(--warm) 30%, transparent)" : "color-mix(in oklab, var(--accent) 25%, transparent)" }}
        >
          {STATUS_LABEL[b.status] ?? b.status}
        </span>
      </div>

      {(b.status === "confirmed" || b.status === "rebooked") && (
        <div className="mt-8">
          <BoardingPass booking={b} departsMin={f.timeline.departs} backMin={f.timeline.backAtPier} />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="surface overflow-hidden rounded-[28px]">
          <ExcursionArt art={ex.art} className="h-44" />
          <div className="p-6 sm:p-8">
            <p className="text-xs font-bold tracking-[0.18em] text-ink-soft uppercase">
              {port.name} · {new Date(port.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} · {b.guests} guest
              {b.guests > 1 ? "s" : ""}
            </p>
            <p className="font-display mt-1 text-2xl">{ex.title}</p>
            {b.originalExcursionId !== b.excursionId && <p className="mt-1 text-sm text-ink-soft">Rebooked from {getExcursion(b.originalExcursionId)?.title} via Trip Rescue.</p>}
            <div className="mt-6">{b.status !== "cancelled_refunded" && <LastBoardTimeline f={f} />}</div>
            {trip.disruption && (
              <p className="mt-4 text-sm">
                <span className="demo-tag mr-2">Simulated</span>Ship arrival in {port.name} delayed {trip.disruption.delayMin} min.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <PaymentEvidence b={b} />
          {canSimulate && <DelayControl reload={reload} portName={port.name} />}
        </div>
      </div>

      {shownRescue && <RescuePanel key={shownRescue.id} rescue={shownRescue} reload={reload} />}

      <button
        className="mt-10 text-sm text-ink-soft underline-offset-4 hover:underline"
        onClick={async () => {
          await api("/api/trip", { method: "DELETE" });
          window.location.href = "/trip";
        }}
      >
        Sign out of this booking on this device
      </button>
    </div>
  );
}

function PaymentEvidence({ b }: { b: Booking }) {
  return (
    <div className="surface rounded-[28px] p-6">
      <p className="eyebrow">Payments · PayPal sandbox</p>
      <p className="font-display mt-2 text-3xl">{fmtUsd(b.paidCents)}</p>
      <p className="text-sm text-ink-soft">net paid, from PayPal-verified records</p>
      <ul className="mt-5 space-y-3 text-sm">
        {b.payments.map((p, i) => (
          <li key={i} className="flex items-start justify-between gap-3 border-t border-line pt-3">
            <span>
              <span className="block font-semibold capitalize">
                {p.kind} · {p.purpose}
              </span>
              <span className="block text-xs text-ink-soft">
                …{p.ref} · {new Date(p.verifiedAt).toLocaleString()}
              </span>
            </span>
            <span className="text-right">
              <span className="block font-semibold">
                {p.kind === "refund" ? "−" : ""}
                {fmtUsd(p.amountCents)}
              </span>
              <span className={`text-[11px] font-bold ${p.status === "COMPLETED" ? "text-accent" : "text-warm"}`}>{p.status}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DelayControl({ reload, portName }: { reload: () => Promise<TripState>; portName: string }) {
  const [delay, setDelay] = useState(90);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="rounded-[28px] border-2 border-dashed border-[#ffd27a]/60 p-6">
      <span className="demo-tag">Demo control</span>
      <p className="mt-3 font-semibold">Simulate a ship delay in {portName}</p>
      <p className="mt-1 text-sm text-ink-soft">This is a simulation for the demo. No live ship data is used.</p>
      <div className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="delay">
          Delay
        </label>
        <select id="delay" className="field" value={delay} onChange={(e) => setDelay(Number(e.target.value))}>
          {[45, 90, 120, 180].map((d) => (
            <option key={d} value={d}>
              {d} minutes late
            </option>
          ))}
        </select>
        <button
          className="btn btn-primary shrink-0"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setErr(null);
            try {
              const r = await api<{ affected: string[] }>("/api/trip/delay", { json: { delayMin: delay } });
              const t = await reload();
              recordProof({
                source: "lastboard",
                kind: "engine",
                title: `Simulated ${delay}-min delay recalculated`,
                detail: { bookings_affected: r.affected.length, rescue_options: t.rescue ? t.rescue.options.length : 0, top_pick: t.rescue?.options[0]?.excursionId ?? "none", simulated: true },
              });
              if (r.affected.length && t.rescue) {
                migo.emit({ type: "disruption:detected", delayMin: delay });
                setTimeout(() => document.getElementById("rescue")?.scrollIntoView({ behavior: "smooth" }), 400);
              }
            } catch (x) {
              setErr((x as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Simulating…" : "Simulate"}
        </button>
      </div>
      {err && <p className="mt-2 text-sm text-warm">{err}</p>}
    </div>
  );
}

function RescuePanel({ rescue, reload }: { rescue: RescueProposal; reload: () => Promise<TripState> }) {
  const { openConcierge } = useCompanion();
  const [choice, setChoice] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [topUp, setTopUp] = useState<{ orderId: string; amountCents: number } | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const original = getExcursion(rescue.excursionId)!;

  useEffect(() => {
    track("rescue.viewed", {});
    migo.emit({ type: "rescue:guiding" });
    api<{ paypalClientId: string | null }>("/api/status").then((s) => setClientId(s.paypalClientId)).catch(() => {});
  }, []);

  // Poll while the operator reviews.
  useEffect(() => {
    if (rescue.operatorReview !== "pending") return;
    const t = setInterval(() => reload().catch(() => {}), 4000);
    return () => clearInterval(t);
  }, [rescue.operatorReview, reload]);

  // If a top-up was already started (e.g. page reload), resume it.
  useEffect(() => {
    if (rescue.status === "awaiting_payment" && rescue.supplementOrderId) {
      const o = rescue.options.find((x) => x.id === rescue.chosenOptionId);
      if (o) setTopUp({ orderId: rescue.supplementOrderId, amountCents: o.deltaCents });
    }
  }, [rescue]);

  const opt = rescue.options.find((o) => o.id === choice);
  const optTitle = (id?: string) => (id ? getExcursion(id)?.title : undefined);
  const consent = opt
    ? opt.kind === "cancel_refund"
      ? `I approve cancelling my booking and refunding ${fmtUsd(-opt.deltaCents)} to my original PayPal payment.`
      : `I approve switching to ${optTitle(opt.excursionId)}${opt.deltaCents < 0 ? ` and a refund of ${fmtUsd(-opt.deltaCents)} to my PayPal` : opt.deltaCents > 0 ? ` and paying ${fmtUsd(opt.deltaCents)} more via PayPal` : " at no extra cost"}.`
    : "";

  const finish = (text: string) => {
    setDone(text);
    migo.emit({ type: "rescue:resolved" });
    track("rescue.approved", {});
    reload();
  };

  return (
    <motion.section id="rescue" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mt-12 scroll-mt-28">
      <div className="surface rounded-[32px] p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <p className="eyebrow">Trip Rescue · LastBoard</p>
          <span className="demo-tag">Simulated {rescue.delayMin}-min delay</span>
        </div>
        <h2 className="font-display mt-3 text-4xl sm:text-5xl">Your ship is running late. Let&apos;s save your day.</h2>
        <RescueSequence rescue={rescue} />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-line p-5">
            <p className="font-semibold">Why {original.title} no longer works</p>
            <LastBoardTimeline f={rescue.original} compact />
            <ul className="mt-3 space-y-1 text-sm text-ink-soft">
              {rescue.original.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-line p-5">
            <p className="font-semibold">Ask Migo</p>
            <p className="mt-1 text-sm text-ink-soft">Migo uses the LastBoard results to explain your options in plain language. He can&apos;t change anything without your approval.</p>
            <button className="btn btn-ghost mt-4" onClick={() => openConcierge("My ship is delayed. Explain my Trip Rescue options and which you'd recommend.")}>
              Explain my options
            </button>
          </div>
        </div>

        {done ? (
          <div className="mt-8 rounded-2xl bg-accent/15 p-6" role="status">
            <p className="font-display text-2xl">Day rescued.</p>
            <p className="mt-1">{done}</p>
          </div>
        ) : rescue.operatorReview === "pending" ? (
          <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-line p-6" role="status">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <div>
              <p className="font-semibold">The excursion operator is reviewing guide, vehicle and seat changes…</p>
              <p className="text-sm text-ink-soft">
                Demo: approve it in the{" "}
                <a href="/operator" target="_blank" rel="noreferrer" className="underline">
                  Operator console
                </a>
                . This page updates automatically.
              </p>
            </div>
          </div>
        ) : topUp ? (
          <div className="mt-8 max-w-md">
            <p className="font-semibold">Pay the {fmtUsd(topUp.amountCents)} difference with PayPal</p>
            {clientId ? (
              <div className="mt-4 rounded-2xl bg-white p-4">
                <PayPalButtons
                  clientId={clientId}
                  createOrder={async () => topUp.orderId}
                  onApproved={async (orderId) => {
                    try {
                      await api("/api/trip/rescue/capture", { json: { orderId } });
                      recordProof({ source: "paypal", kind: "live", title: "Top-up capture verified", detail: { order_id: orderId, amount_usd: (topUp.amountCents / 100).toFixed(2) } });
                      finish(`You're booked on the new excursion. PayPal confirmed your ${fmtUsd(topUp.amountCents)} top-up.`);
                      return "ok";
                    } catch (e) {
                      const x = e as Error & { code?: string };
                      if (x.code === "INSTRUMENT_DECLINED") return "restart";
                      setErr(x.message);
                      return "ok";
                    }
                  }}
                  onCancel={() => setErr("You closed PayPal. No payment was taken; your original booking is unchanged.")}
                  onError={(m) => setErr(m)}
                />
              </div>
            ) : (
              <p className="mt-2 text-sm text-warm">PayPal isn&apos;t configured on this server.</p>
            )}
            {err && <p className="mt-3 text-sm text-warm">{err}</p>}
          </div>
        ) : (
          <>
            {rescue.operatorNote && <p className="mt-6 text-sm text-ink-soft">Operator note: {rescue.operatorNote}</p>}
            <fieldset className="mt-8">
              <legend className="mb-4 font-semibold">Choose what happens next</legend>
              <div className="grid gap-4 md:grid-cols-2">
                {rescue.options.map((o) => {
                  const e = o.excursionId ? getExcursion(o.excursionId) : undefined;
                  const on = choice === o.id;
                  return (
                    <label key={o.id} className={`cursor-pointer rounded-2xl border p-5 transition ${on ? "border-accent bg-accent/10" : "border-line hover:bg-white/5"}`}>
                      <input type="radio" name="rescue" className="sr-only" checked={on} onChange={() => setChoice(o.id)} />
                      <span className="flex items-start justify-between gap-3">
                        <span>
                          {o.rank === 1 && o.kind === "switch" && <span className="eyebrow block">LastBoard&apos;s top pick</span>}
                          <span className="font-display block text-xl">{e ? e.title : "Cancel with full refund"}</span>
                        </span>
                        <span className="shrink-0 text-right text-sm font-bold">
                          {o.deltaCents === 0 ? "No change" : o.deltaCents < 0 ? `Refund ${fmtUsd(-o.deltaCents)}` : `+${fmtUsd(o.deltaCents)}`}
                        </span>
                      </span>
                      <span className="mt-2 block text-sm text-ink-soft">{o.why}</span>
                      {o.feasibility && (
                        <span className="mt-3 block">
                          <LastBoardTimeline f={o.feasibility} compact />
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            {opt && (
              <div className="mt-6 rounded-2xl border border-line p-5">
                <label className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--accent)]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                  <span>{consent}</span>
                </label>
                <button
                  className="btn btn-primary mt-4"
                  disabled={!agree || busy}
                  onClick={async () => {
                    setBusy(true);
                    setErr(null);
                    try {
                      const r = await api<
                        | { kind: "payment_required"; orderId: string; amountCents: number }
                        | { kind: "resolved"; refunds: { amountCents: number; status: string }[]; refundsCompleted: boolean }
                      >("/api/trip/rescue/approve", { json: { optionId: opt.id, confirm: true } });
                      if (r.kind === "payment_required") {
                        recordProof({ source: "paypal", kind: "live", title: "Top-up order created", detail: { order_id: r.orderId, amount_usd: (r.amountCents / 100).toFixed(2) } });
                        setTopUp({ orderId: r.orderId, amountCents: r.amountCents });
                      } else {
                        r.refunds.forEach((x) => recordProof({ source: "paypal", kind: "live", title: "Payments v2: refund", detail: { amount_usd: (x.amountCents / 100).toFixed(2), status: x.status } }));
                        const refundText = r.refunds.length ? ` PayPal refund status: ${r.refunds.map((x) => `${fmtUsd(x.amountCents)} ${x.status}`).join(", ")}.` : "";
                        finish(
                          (opt.kind === "cancel_refund" ? "Your booking is cancelled." : `You're now booked on ${optTitle(opt.excursionId)}.`) +
                            refundText +
                            (r.refundsCompleted ? "" : " PayPal hasn't marked the refund completed yet; the operator can re-verify it."),
                        );
                      }
                    } catch (e) {
                      setErr((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy ? "Working with PayPal…" : "Approve this change"}
                </button>
                {err && (
                  <p className="mt-3 text-sm text-warm" role="alert">
                    {err}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <p className="mt-4 text-xs text-ink-soft">
        LastBoard uses demo timings and policy buffers. It is a planning aid, not a guarantee of return-to-ship times. <TideLink href="/excursions" className="underline">Browse other tours</TideLink>
      </p>
    </motion.section>
  );
}

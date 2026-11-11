"use client";

import { useCallback, useEffect, useState } from "react";
import { getExcursion, getPort } from "@/lib/domain/catalog";
import { fmtMin, fmtUsd, toMin } from "@/lib/domain/time";
import { SceneRoute } from "@/components/scene/SceneProvider";
import { TideLink } from "@/components/transition/TideTransition";
import { api } from "@/lib/client/track";

interface Pay {
  kind: "charge" | "refund";
  amountCents: number;
  status: string;
  purpose: string;
  verifiedAt: string;
  ref: string;
}
interface Booking {
  ref: string;
  status: string;
  firstName: string;
  guests: number;
  excursionId: string;
  originalExcursionId: string;
  excursionTitle: string;
  portName: string;
  totalCents: number;
  paidCents: number;
  payments: Pay[];
  updatedAt: string;
}

const STATUS: Record<string, { label: string; tone: string }> = {
  confirmed: { label: "Confirmed", tone: "bg-accent text-accent-ink" },
  rebooked: { label: "Rebooked via Trip Rescue", tone: "bg-accent text-accent-ink" },
  disrupted: { label: "Needs attention: schedule changed", tone: "bg-warm text-navy" },
  cancelled_refunded: { label: "Cancelled · refunded", tone: "bg-white/20 text-ink" },
};

function paymentSummary(b: Booking) {
  const charge = b.payments.find((p) => p.kind === "charge");
  const refunds = b.payments.filter((p) => p.kind === "refund");
  if (!charge) return "No captured payment";
  const refunded = refunds.reduce((n, r) => n + r.amountCents, 0);
  const pending = refunds.some((r) => r.status !== "COMPLETED");
  if (refunded === 0) return `PayPal sandbox capture ${charge.status}`;
  return `${refunded >= charge.amountCents ? "Refunded" : "Partially refunded"} ${fmtUsd(refunded)}${pending ? " (pending at PayPal)" : ""}`;
}

/**
 * Bookings: the verified booking for this browser session, with booking and
 * payment state exactly as recorded from PayPal. Sign-in = booking ref + last name.
 */
export default function BookingsPage() {
  const [state, setState] = useState<"loading" | "signin" | "ready">("loading");
  const [b, setB] = useState<Booking | null>(null);
  const [ref, setRef] = useState("");
  const [last, setLast] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api<{ verified: boolean; booking?: Booking }>("/api/trip");
      if (r.verified && r.booking) {
        setB(r.booking);
        setState("ready");
      } else setState("signin");
    } catch {
      setState("signin");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const ex = b ? getExcursion(b.excursionId) : undefined;
  const port = ex ? getPort(ex.portId) : undefined;
  const st = b ? STATUS[b.status] ?? { label: b.status.replace(/_/g, " "), tone: "bg-white/20 text-ink" } : null;

  return (
    <>
      <SceneRoute scene="shade" />
      <section className="px-5 pb-40 pt-32 sm:px-10">
        <div className="mx-auto max-w-[1100px]">
          <p className="eyebrow">Bookings</p>
          <h1 className="font-display mt-3 text-5xl leading-[1.02] sm:text-6xl">Your bookings</h1>
          <p className="mt-4 max-w-2xl text-ink-soft">Booking and payment status as recorded from PayPal (sandbox). Nothing here is estimated by the AI.</p>

          {state === "loading" && <div className="surface mt-8 h-48 animate-pulse rounded-[28px]" />}

          {state === "signin" && (
            <form
              className="surface mt-8 grid max-w-lg gap-4 rounded-[28px] p-6 sm:p-8"
              onSubmit={async (e) => {
                e.preventDefault();
                setErr(null);
                try {
                  await api("/api/trip/verify", { json: { ref, lastName: last } });
                  await load();
                } catch (x) {
                  setErr((x as Error).message);
                }
              }}
            >
              <p className="font-display text-2xl">Find my booking</p>
              <label className="grid gap-1.5 text-sm font-semibold">
                Booking reference
                <input className="field" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="SM-XXXXX" required maxLength={12} />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                Last name
                <input className="field" value={last} onChange={(e) => setLast(e.target.value)} required maxLength={60} autoComplete="family-name" />
              </label>
              {err && (
                <p className="text-sm text-warm" role="alert">
                  {err}
                </p>
              )}
              <button className="btn btn-primary">View bookings</button>
              <p className="text-xs text-ink-soft">
                No booking yet?{" "}
                <TideLink href="/excursions" className="underline">
                  Explore excursions
                </TideLink>
              </p>
            </form>
          )}

          {state === "ready" && b && ex && port && st && (
            <div className="mt-8 space-y-4">
              <article className="surface overflow-hidden rounded-[28px]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
                  <p className="font-mono text-lg font-bold tracking-wider">{b.ref}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${st.tone}`}>{st.label}</span>
                </div>
                <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
                  <Field k="Experience" v={b.excursionTitle} sub={b.originalExcursionId !== b.excursionId ? `Originally: ${getExcursion(b.originalExcursionId)?.title}` : undefined} />
                  <Field k="When" v={`${port.name} · ${new Date(port.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`} sub={`Departs ${fmtMin(toMin(ex.start))}`} />
                  <Field k="Guests" v={`${b.firstName} +${b.guests - 1} (${b.guests})`} sub="Operator: Tidewalk Tours (demo)" />
                  <Field k="Payment" v={paymentSummary(b)} sub={`Net paid ${fmtUsd(b.paidCents)} · total ${fmtUsd(b.totalCents)}`} />
                </div>
                <div className="border-t border-line px-6 py-4">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-ink-soft uppercase">PayPal sandbox records</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {b.payments.map((p, i) => (
                      <li key={i} className="flex flex-wrap justify-between gap-2">
                        <span>
                          {p.kind === "charge" ? "Capture" : "Refund"} {fmtUsd(p.amountCents)} · <strong>{p.status}</strong>
                        </span>
                        <span className="font-mono text-xs text-ink-soft">…{p.ref}</span>
                      </li>
                    ))}
                    {b.payments.length === 0 && <li className="text-ink-soft">No payment recorded.</li>}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-line px-6 py-4">
                  <TideLink href="/trip" className="btn btn-primary !py-2 text-sm">
                    Open in My Trip
                  </TideLink>
                  <button
                    className="btn btn-ghost !py-2 text-sm"
                    onClick={async () => {
                      await fetch("/api/trip", { method: "DELETE" });
                      setB(null);
                      setState("signin");
                    }}
                  >
                    Sign out of this booking
                  </button>
                </div>
              </article>
              <p className="text-xs text-ink-soft">One booking per sign-in in this demo: each booking is protected by its own reference and last name.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function Field({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold tracking-[0.2em] text-ink-soft uppercase">{k}</p>
      <p className="mt-1 font-semibold">{v}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-soft">{sub}</p>}
    </div>
  );
}

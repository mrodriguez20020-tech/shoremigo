"use client";

import { use, useCallback, useEffect, useState } from "react";
import { getExcursion, getPort } from "@/lib/domain/catalog";
import { fmtUsd } from "@/lib/domain/time";
import { SceneRoute } from "@/components/scene/SceneProvider";
import { migo } from "@/components/migo/bus";
import { PayPalButtons } from "@/components/checkout/PayPalButtons";
import { ExcursionArt } from "@/components/excursion/ExcursionArt";
import { TideLink, useTide } from "@/components/transition/TideTransition";
import { api, track } from "@/lib/client/track";
import { recordProof } from "@/lib/client/proof";

interface PublicBooking {
  id: string;
  ref: string;
  status: string;
  firstName: string;
  guests: number;
  excursionId: string;
  totalCents: number;
  unitPriceCents: number;
}

type Phase = "loading" | "ready" | "capturing" | "cancelled" | "error" | "missing";

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { go } = useTide();
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [clientId, setClientId] = useState<string | null | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    migo.emit({ type: "checkout:entered" });
    track("checkout.viewed", {});
    return () => migo.emit({ type: "checkout:left" });
  }, []);

  useEffect(() => {
    Promise.all([api<{ booking: PublicBooking }>(`/api/bookings/${id}`), api<{ paypalClientId: string | null }>("/api/status")])
      .then(([b, s]) => {
        setBooking(b.booking);
        setClientId(s.paypalClientId);
        setPhase("ready");
      })
      .catch(() => setPhase("missing"));
  }, [id]);

  const createOrder = useCallback(async () => {
    setMessage(null);
    try {
      const r = await api<{ orderId: string; status: string }>(`/api/bookings/${id}/order`, { method: "POST" });
      recordProof({ source: "paypal", kind: "live", title: "Orders v2: order created", detail: { order_id: r.orderId, status: r.status, intent: "CAPTURE", amount_set_by: "server" } });
      return r.orderId;
    } catch (e) {
      setPhase("error");
      setMessage((e as Error).message);
      throw e;
    }
  }, [id]);

  const onApproved = useCallback(
    async (orderId: string): Promise<"ok" | "restart"> => {
      setPhase("capturing");
      try {
        const r = await api<{ booking: PublicBooking; verified: boolean }>(`/api/bookings/${id}/capture`, { json: { orderId } });
        if (r.booking.status !== "confirmed") throw new Error("Payment was not confirmed.");
        const cap = (r.booking as unknown as { payments: { kind: string; status: string; amountCents: number; ref: string }[] }).payments.find((p) => p.kind === "charge");
        recordProof({
          source: "paypal",
          kind: "live",
          title: "Capture verified server-side",
          detail: { order_id: orderId, capture_ref: cap ? `…${cap.ref}` : null, capture_status: cap?.status ?? null, amount_usd: cap ? (cap.amountCents / 100).toFixed(2) : null, checks: "status, custom_id, currency, amount" },
        });
        // Only now — after server-side PayPal verification — does Migo celebrate.
        track("checkout.captured", { excursionId: r.booking.excursionId });
        migo.emit({ type: "checkout:left" });
        migo.emit({ type: "booking:verified", ref: r.booking.ref });
        go("/trip?confirmed=1");
        return "ok";
      } catch (e) {
        const err = e as Error & { code?: string };
        recordProof({ source: "paypal", kind: "live", title: "PayPal rejected / not verified", detail: { order_id: orderId, code: err.code ?? "error", message: err.message.slice(0, 140) } });
        if (err.code === "INSTRUMENT_DECLINED") {
          setPhase("ready");
          setMessage("That payment method was declined. Please choose another one in PayPal.");
          return "restart";
        }
        setPhase("error");
        setMessage(err.message);
        return "ok";
      }
    },
    [id, go],
  );

  const ex = booking ? getExcursion(booking.excursionId) : undefined;

  return (
    <>
      <SceneRoute scene="neutral" />
      <section className="px-5 pb-40 pt-28 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow">Secure checkout · PayPal sandbox</p>
          <h1 className="font-display mt-2 text-4xl sm:text-5xl">Confirm your adventure</h1>

          {phase === "loading" && <div className="surface mt-8 h-72 animate-pulse rounded-[28px]" aria-label="Loading booking" />}

          {phase === "missing" && (
            <div className="surface mt-8 rounded-[28px] p-8">
              <p className="font-display text-2xl">We couldn&apos;t find that booking.</p>
              <p className="mt-2 text-ink-soft">The link may be incomplete, or the hold expired.</p>
              <TideLink href="/excursions" className="btn btn-primary mt-6">
                Browse excursions
              </TideLink>
            </div>
          )}

          {booking && ex && phase !== "loading" && phase !== "missing" && (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="surface overflow-hidden rounded-[28px]">
                <ExcursionArt art={ex.art} className="h-40" />
                <div className="p-6 sm:p-8">
                  <p className="text-xs font-bold tracking-[0.18em] text-ink-soft uppercase">
                    {getPort(ex.portId)?.name} · Ref {booking.ref}
                  </p>
                  <p className="font-display mt-1 text-2xl">{ex.title}</p>
                  <dl className="mt-6 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-ink-soft">Lead guest</dt>
                      <dd className="font-semibold">{booking.firstName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-soft">
                        {booking.guests} × {fmtUsd(booking.unitPriceCents)}
                      </dt>
                      <dd className="font-semibold">{fmtUsd(booking.totalCents)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-line pt-3 text-base">
                      <dt className="font-semibold">Total (USD)</dt>
                      <dd className="font-display text-2xl">{fmtUsd(booking.totalCents)}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-xs text-ink-soft">Price calculated by ShoreMigo&apos;s server from the tour catalog. Seats are held for 15 minutes.</p>
                </div>
              </div>

              <div className="surface rounded-[28px] p-6 sm:p-8" aria-live="polite">
                {booking.status !== "pending_payment" ? (
                  <div>
                    <p className="font-display text-2xl">{booking.status === "confirmed" ? "This booking is already paid." : `This booking is ${booking.status.replace("_", " ")}.`}</p>
                    <TideLink href="/trip" className="btn btn-primary mt-6">
                      Go to my trip
                    </TideLink>
                  </div>
                ) : clientId === null ? (
                  <div>
                    <p className="font-display text-2xl">PayPal sandbox isn&apos;t configured on this server.</p>
                    <p className="mt-3 text-sm text-ink-soft">
                      Add <code>PAYPAL_CLIENT_ID</code> and <code>PAYPAL_CLIENT_SECRET</code> (sandbox app) to <code>.env.local</code> and restart. We don&apos;t simulate payments.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold">Pay with PayPal</p>
                    <p className="mb-5 mt-1 text-sm text-ink-soft">PayPal opens in a secure window. Use a sandbox buyer account; no real money moves.</p>
                    {phase === "capturing" ? (
                      <div className="flex h-[104px] items-center justify-center gap-3 rounded-2xl border border-line" role="status">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                        Verifying your payment with PayPal…
                      </div>
                    ) : (
                      clientId && (
                        <PayPalButtons
                          clientId={clientId}
                          createOrder={createOrder}
                          onApproved={onApproved}
                          onCancel={() => {
                            setPhase("cancelled");
                            setMessage(null);
                            track("checkout.abandoned", {});
                          }}
                          onError={(m) => {
                            setPhase("error");
                            setMessage(m);
                          }}
                        />
                      )
                    )}
                    {phase === "cancelled" && <p className="mt-4 rounded-xl bg-black/5 px-4 py-3 text-sm">You closed PayPal before approving. No payment was taken; your seats stay held for now.</p>}
                    {message && (
                      <p className="mt-4 rounded-xl bg-warm/10 px-4 py-3 text-sm" role="alert">
                        {message}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

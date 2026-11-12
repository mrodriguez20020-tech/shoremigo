"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { MEETING_POINTS, getExcursion, getPort } from "@/lib/domain/catalog";
import { fmtMin, fmtUsd } from "@/lib/domain/time";
import { CompassMark } from "@/components/brand/Wordmark";

interface Payment {
  kind: "charge" | "refund";
  amountCents: number;
  status: string;
  ref: string;
}

/**
 * Shareable "Shore Pass". The PayPal stamp shows the capture status exactly
 * as recorded from PayPal's API. The share text omits last name and email.
 */
export function BoardingPass({
  booking,
  departsMin,
  backMin,
}: {
  booking: { ref: string; firstName: string; guests: number; excursionId: string; status: string; paidCents: number; payments: Payment[] };
  departsMin: number;
  backMin: number;
}) {
  const ex = getExcursion(booking.excursionId)!;
  const port = getPort(ex.portId)!;
  const charge = booking.payments.find((p) => p.kind === "charge");
  const refunded = booking.payments.filter((p) => p.kind === "refund").reduce((n, p) => n + p.amountCents, 0);
  const date = new Date(port.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const [shared, setShared] = useState<string | null>(null);
  // Real verification link + QR, issued by the server for the verified guest. No placeholder QR is ever drawn.
  const [pass, setPass] = useState<{ url: string; svg: string } | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/trip/pass", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (live && j?.url && j?.svg) setPass({ url: j.url, svg: j.svg }); })
      .catch(() => {});
    return () => { live = false; };
  }, [booking.ref, booking.status]);

  const share = async () => {
    const text = `My ShoreMigo shore day: ${ex.title} in ${port.name} on ${date}, departing ${fmtMin(departsMin)}. Ref ${booking.ref}.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "ShoreMigo Shore Pass", text });
        setShared("Shared");
      } else {
        await navigator.clipboard.writeText(text);
        setShared("Copied to clipboard");
      }
    } catch {
      setShared(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: 12 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
      className="print-pass relative mx-auto max-w-4xl [perspective:1200px]"
      data-shore-pass
    >
      <div
        className="relative grid overflow-hidden rounded-[28px] text-[#1b1530] shadow-[0_50px_100px_-40px_rgba(40,10,40,0.7)] md:grid-cols-[1fr_260px]"
        style={{ background: "linear-gradient(135deg, #fff8ec 0%, #fdeedd 55%, #f8e2cf 100%)" }}
      >
        {/* sheen */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ x: "-120%" }}
          animate={{ x: "120%" }}
          transition={{ delay: 0.8, duration: 1.6, ease: "easeInOut" }}
          style={{ background: "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.7) 50%, transparent 70%)" }}
        />
        {/* main */}
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CompassMark size={26} />
              <span className="text-[11px] font-extrabold tracking-[0.32em] uppercase">ShoreMigo · Shore Pass</span>
            </div>
            <span className="rounded-full bg-[#1b1530] px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-[#fff3dc] uppercase">
              {booking.status === "rebooked" ? "Rebooked via Trip Rescue" : "Confirmed"}
            </span>
          </div>
          <p className="mt-6 text-[11px] font-bold tracking-[0.2em] text-[#7a5a6a] uppercase">
            {port.name}, {port.country} · {date}
          </p>
          <h3 className="font-display mt-1 text-3xl leading-tight sm:text-4xl">{ex.title}</h3>
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
            <Field k="Guest" v={`${booking.firstName} +${booking.guests - 1}`} />
            <Field k="Departs" v={fmtMin(departsMin)} />
            <Field k="Back at pier" v={fmtMin(backMin)} />
            <Field k="Guests" v={String(booking.guests)} />
          </dl>
          <p className="mt-5 text-xs text-[#7a5a6a]">
            <strong className="text-[#1b1530]">Meet:</strong> {MEETING_POINTS[port.id]}
          </p>
        </div>

        {/* perforation */}
        <div className="pointer-events-none absolute bottom-0 top-0 hidden w-0 border-l-2 border-dashed border-[#d9bfa8] md:block" style={{ right: 260 }}>
          <span className="absolute -left-[13px] -top-3 h-6 w-6 rounded-full bg-[var(--sea-2)]" />
          <span className="absolute -bottom-3 -left-[13px] h-6 w-6 rounded-full bg-[var(--sea-2)]" />
        </div>

        {/* stub */}
        <div className="relative flex flex-col justify-between gap-5 border-t-2 border-dashed border-[#d9bfa8] p-6 md:border-t-0">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#7a5a6a] uppercase">Booking ref</p>
            <p className="font-mono text-2xl font-bold tracking-wider">{booking.ref}</p>
          </div>
          <motion.div
            initial={{ scale: 1.6, opacity: 0, rotate: -18 }}
            animate={{ scale: 1, opacity: 1, rotate: -8 }}
            transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 14 }}
            className="w-fit rounded-xl border-[3px] border-[#0b6b5e] px-3 py-2 text-[#0b6b5e]"
          >
            <p className="text-[10px] font-extrabold tracking-[0.2em] uppercase">PayPal sandbox</p>
            <p className="text-sm font-black tracking-wide">{charge ? `CAPTURE ${charge.status}` : "NO CAPTURE"}</p>
            {charge && <p className="font-mono text-[10px]">…{charge.ref}</p>}
          </motion.div>
          <div className="text-sm">
            <p className="flex justify-between">
              <span className="text-[#7a5a6a]">Paid (net)</span> <strong>{fmtUsd(booking.paidCents)}</strong>
            </p>
            {refunded > 0 && (
              <p className="flex justify-between text-xs">
                <span className="text-[#7a5a6a]">Refunded</span> <span>{fmtUsd(refunded)}</span>
              </p>
            )}
          </div>
          {pass && (
            <a href={pass.url} target="_blank" rel="noreferrer" className="block w-fit" aria-label="Shore Pass verification link (also encoded in this QR code)">
              <span className="block h-28 w-28 [&_svg]:h-full [&_svg]:w-full" data-pass-qr dangerouslySetInnerHTML={{ __html: pass.svg }} />
              <span className="mt-1 block text-[10px] font-bold tracking-[0.16em] text-[#7a5a6a] uppercase">Scan to verify</span>
            </a>
          )}
          <div className="no-print flex flex-col gap-2">
            <button onClick={share} className="rounded-full bg-[#1b1530] px-4 py-2.5 text-sm font-bold text-[#fff3dc] transition hover:-translate-y-0.5">
              {shared ?? "Share my shore day"}
            </button>
            <button onClick={() => window.print()} className="rounded-full border-2 border-[#1b1530] px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5">
              Print or save as PDF
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold tracking-[0.18em] text-[#7a5a6a] uppercase">{k}</dt>
      <dd className="mt-0.5 font-semibold">{v}</dd>
    </div>
  );
}

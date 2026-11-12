import type { Metadata } from "next";
import Link from "next/link";
import { verifyPass } from "@/lib/server/pass";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shore Pass verification · ShoreMigo", robots: { index: false, follow: false } };

const LABEL = {
  valid: { title: "Valid Shore Pass", tone: "#0b6b5e", note: "Booking is confirmed in ShoreMigo's records right now." },
  under_review: { title: "Schedule under review", tone: "#9a5b00", note: "A ship delay affects this excursion. The guest is choosing an alternative or a refund through Trip Rescue." },
  not_valid: { title: "Not valid", tone: "#a3262a", note: "This booking is not active (cancelled, refunded, expired or unpaid)." },
  unknown: { title: "Pass not recognised", tone: "#a3262a", note: "This link is not a ShoreMigo Shore Pass, or it has been altered." },
} as const;

export default async function PassVerification({ params }: { params: Promise<{ token: string }> }) {
  const v = await verifyPass(decodeURIComponent((await params).token));
  const l = LABEL[v.validity];
  return (
    <main id="main" className="mx-auto max-w-xl px-5 py-16">
      <p className="eyebrow">ShoreMigo · Shore Pass check</p>
      <section className="surface mt-4 rounded-[28px] p-6 sm:p-8" aria-live="polite">
        <p className="text-2xl font-black" style={{ color: l.tone }} data-pass-validity={v.validity}>
          {l.title}
        </p>
        <p className="mt-2 text-sm text-ink-soft">{l.note}</p>
        {v.validity !== "unknown" && (
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Row k="Booking ref" v={v.ref} />
            <Row k="Lead guest" v={`${v.firstName} (${v.guests} ${v.guests === 1 ? "guest" : "guests"})`} />
            <Row k="Excursion" v={v.excursion} />
            <Row k="Port" v={v.port} />
            <Row k="Departs" v={v.departs} />
            <Row k="Back at pier" v={v.backAtPier} />
          </dl>
        )}
        {v.validity !== "unknown" && <p className="mt-6 text-xs text-ink-soft">Checked live at {new Date(v.checkedAt).toUTCString()}. Demo sailing: ship and operators are fictional; ports are real.</p>}
      </section>
      <p className="mt-6 text-xs text-ink-soft">
        Only the lead guest&apos;s first name is shown. No email, last name or payment details are exposed here. <Link href="/" className="underline">ShoreMigo</Link>
      </p>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold tracking-[0.18em] text-ink-soft uppercase">{k}</dt>
      <dd className="mt-0.5 font-semibold">{v}</dd>
    </div>
  );
}

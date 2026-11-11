"use client";

import { useMemo, useState } from "react";
import { SceneRoute } from "@/components/scene/SceneProvider";
import { SpriteMigo } from "@/components/migo/SpriteMigo";
import { TideLink } from "@/components/transition/TideTransition";
import { fmtUsd } from "@/lib/domain/time";

/** Illustrative rate for the concept only. No referral tracking or payouts exist in this demo. */
const ILLUSTRATIVE_RATE = 0.08;
const SAMPLE_AVG_BOOKING_CENTS = 17800; // e.g. 2 × $89 snorkel (demo inventory)

function codeFrom(handle: string) {
  const base = handle.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 8) || "CREATOR";
  return `CREW-${base}`;
}

export default function CrewPage() {
  const [handle, setHandle] = useState("marisol.eats");
  const [bookings, setBookings] = useState(12);
  const [copied, setCopied] = useState(false);
  const code = useMemo(() => codeFrom(handle), [handle]);
  const link = `https://shoremigo.vercel.app/?crew=${code}`;
  const estimate = Math.round(bookings * SAMPLE_AVG_BOOKING_CENTS * ILLUSTRATIVE_RATE);

  return (
    <>
      <SceneRoute scene="sunset" />
      <section className="px-5 pb-40 pt-32 sm:px-10">
        <div className="mx-auto max-w-[1300px]">
          <p className="eyebrow flex flex-wrap items-center gap-3">
            <span>ShoreMigo Crew</span>
            <span className="demo-tag">Concept demo · no payouts</span>
          </p>
          <h1 className="font-display mt-3 max-w-4xl text-5xl leading-[1.02] sm:text-7xl">Share the islands you love.</h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-soft">
            Crew is a planned program for travel creators and local guides: share ShoreMigo experiences with your audience and earn when they book. This page is an
            interactive concept; referral tracking and commissions are not live.
          </p>

          <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <article className="surface relative overflow-hidden rounded-[28px] p-7">
              <div className="pointer-events-none absolute -right-4 -top-2 opacity-90" aria-hidden>
                <SpriteMigo pose="point" size={120} reflection={false} />
              </div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-ink-soft uppercase">Example profile · fictional</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#f69a8e] to-[#f4c777] font-display text-2xl text-navy">M</div>
                <div>
                  <p className="font-display text-2xl">Marisol R.</p>
                  <p className="text-sm text-ink-soft">Island food creator · fictional example</p>
                </div>
              </div>
              <p className="mt-5 max-w-sm text-sm text-ink-soft">&ldquo;I film where the locals eat between port calls. My followers ask what fits in a cruise day, so ShoreMigo&apos;s schedule check is the part I&apos;d share.&rdquo;</p>
              <p className="mt-2 text-[11px] text-ink-soft">Illustrative quote for the concept, not a real person or testimonial.</p>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                {[
                  ["Picks", "4"],
                  ["Ports", "2"],
                  ["Status", "Concept"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-white/10 p-3">
                    <p className="font-display text-xl">{v}</p>
                    <p className="text-[10px] font-bold tracking-wide text-ink-soft uppercase">{k}</p>
                  </div>
                ))}
              </div>
            </article>

            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
              <div className="surface rounded-[28px] p-7">
                <p className="font-display text-2xl">Your referral link</p>
                <label className="mt-4 grid gap-1.5 text-sm font-semibold">
                  Creator handle
                  <input className="field" value={handle} onChange={(e) => setHandle(e.target.value)} maxLength={30} />
                </label>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-2xl bg-black/20 px-4 py-3 text-sm">{link}</code>
                  <button
                    className="btn btn-primary !py-2 text-sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(link);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1800);
                      } catch {
                        setCopied(false);
                      }
                    }}
                  >
                    {copied ? "Copied" : "Copy link"}
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-ink-soft">Code {code}. Generated in your browser for the demo; visits and bookings are not tracked yet.</p>
              </div>

              <div className="surface rounded-[28px] p-7">
                <p className="font-display text-2xl">Illustrative earnings</p>
                <label className="mt-4 block text-sm font-semibold">
                  Bookings referred per month: <span className="text-accent">{bookings}</span>
                  <input type="range" min={0} max={60} value={bookings} onChange={(e) => setBookings(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" />
                </label>
                <p className="mt-4 font-display text-4xl text-accent">{fmtUsd(estimate)}</p>
                <p className="mt-1 text-xs text-ink-soft">
                  {bookings} × sample booking {fmtUsd(SAMPLE_AVG_BOOKING_CENTS)} × illustrative {Math.round(ILLUSTRATIVE_RATE * 100)}% rate. A hypothetical estimate: no
                  commission terms exist, nothing is paid out, and this is not an earnings claim.
                </p>
              </div>
            </div>
          </div>

          <ol className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              ["Share", "Pick experiences you've actually done and share your link or code."],
              ["Travelers book", "They book through ShoreMigo with the same schedule checks and PayPal checkout."],
              ["Earn (planned)", "Commission terms, attribution and payouts are on the roadmap, after operator agreements."],
            ].map(([h, p], i) => (
              <li key={h} className="surface rounded-[24px] p-6">
                <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">Step {i + 1}</p>
                <p className="font-display mt-2 text-xl">{h}</p>
                <p className="mt-2 text-sm text-ink-soft">{p}</p>
              </li>
            ))}
          </ol>
          <TideLink href="/excursions" className="btn btn-ghost mt-8">
            Browse experiences to share →
          </TideLink>
        </div>
      </section>
    </>
  );
}

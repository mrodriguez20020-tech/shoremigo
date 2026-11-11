import { notFound } from "next/navigation";
import { GUIDES, MEETING_POINTS, POLICY, getExcursion, getPort } from "@/lib/domain/catalog";
import { fmtDuration, fmtMin, fmtUsd, toMin } from "@/lib/domain/time";
import { availabilitySnapshot } from "@/lib/server/bookings";
import { SceneRoute } from "@/components/scene/SceneProvider";
import { ExcursionArt } from "@/components/excursion/ExcursionArt";
import { LastBoardTimeline } from "@/components/excursion/LastBoardTimeline";
import { ReserveForm } from "@/components/excursion/ReserveForm";
import { ExcursionMigo } from "@/components/excursion/ExcursionMigo";
import { ProofOnMount } from "@/components/proof/ProofOnMount";
import { TideLink } from "@/components/transition/TideTransition";
import { Reveal } from "@/components/ui/Reveal";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const dynamic = "force-dynamic";

export default async function ExcursionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ guests?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const e = getExcursion(id);
  if (!e) notFound();
  const port = getPort(e.portId)!;
  const s = (await availabilitySnapshot()).find((x) => x.excursionId === e.id)!;
  const guide = GUIDES[e.guideId];
  const initialGuests = Math.min(POLICY.maxGuests, Math.max(1, Number(sp.guests) || 2));

  return (
    <>
      <SceneRoute scene={port.scene === "sunset" ? "sunset" : e.category === "nature" || e.category === "adventure" ? "shade" : "day"} />
      <ExcursionMigo excursionId={e.id} title={e.title} feasible={s.feasibility.status !== "infeasible"} />
      <ProofOnMount
        event={{
          source: "lastboard",
          kind: "engine",
          title: `${e.title}: ${s.feasibility.status.toUpperCase()}`,
          detail: {
            ship_arrives: fmtMin(s.feasibility.timeline.shipArrive),
            ready_at_meeting_point: fmtMin(s.feasibility.timeline.readyAtMeetingPoint),
            departs: fmtMin(s.feasibility.timeline.departs),
            back_at_pier: fmtMin(s.feasibility.timeline.backAtPier),
            safety_cutoff: fmtMin(s.feasibility.timeline.latestBack),
            margin_min: s.feasibility.slackMin,
            seats_left: s.seatsLeft,
            simulated_delay_min: s.disruption?.delayMin ?? 0,
          },
        }}
      />
      <section className="px-5 pb-10 pt-28 sm:px-10">
        <div className="mx-auto max-w-[1400px]">
          <TideLink href={`/excursions?port=${port.id}`} className="text-sm font-semibold text-ink-soft hover:text-ink">
            ← {port.name} tours
          </TideLink>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <Reveal>
                <ExcursionArt art={e.art} className="aspect-[16/8] rounded-[32px] shadow-[0_50px_100px_-50px_rgba(0,0,0,0.7)]" />
              </Reveal>
              <Reveal delay={0.1}>
                <p className="eyebrow mt-10">
                  {port.name}, {port.country} · {new Date(port.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
                <h1 className="font-display mt-3 text-5xl leading-[1.02] sm:text-6xl">{e.title}</h1>
                <p className="mt-4 text-xl text-ink-soft">{e.tagline}</p>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed">{e.description}</p>
              </Reveal>
              <Reveal delay={0.15} className="mt-8 grid gap-4 sm:grid-cols-3">
                {e.highlights.map((h) => (
                  <div key={h} className="surface rounded-2xl p-4 text-sm font-semibold">
                    {h}
                  </div>
                ))}
              </Reveal>
              <Reveal delay={0.2} className="surface mt-8 rounded-[28px] p-6 sm:p-8">
                <LastBoardTimeline f={s.feasibility} />
                {s.disruption && (
                  <p className="mt-4 text-sm">
                    <span className="demo-tag mr-2">Simulated</span>
                    Ship arrival delayed by {s.disruption.delayMin} minutes. Times above already include the delay.
                  </p>
                )}
              </Reveal>
              <Reveal delay={0.25}>
                <dl className="mt-8 grid gap-6 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="eyebrow">Meeting point</dt>
                    <dd className="mt-1">{MEETING_POINTS[port.id]}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Timing</dt>
                    <dd className="mt-1">
                      {e.startMode === "fixed" ? `Departs ${fmtMin(toMin(e.start))}` : `Departs when you're ready, ${fmtMin(toMin(e.start))}–${fmtMin(toMin(e.latestStart!))}`} ·{" "}
                      {fmtDuration(e.durationMin)} · {e.transferMin} min transfer each way
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Guide</dt>
                    <dd className="mt-1">
                      {guide?.name} · {guide?.languages.join(", ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Activity level</dt>
                    <dd className="mt-1">{["", "Easy", "Moderate", "Strenuous"][e.intensity]}</dd>
                  </div>
                </dl>
              </Reveal>
            </div>
            <aside className="lg:sticky lg:top-28 lg:self-start" id="reserve" data-migo-avoid>
              <Reveal delay={0.1}>
                <div className="surface rounded-[28px] p-6 sm:p-8">
                  <p className="eyebrow">Reserve</p>
                  <p className="font-display mt-2 text-4xl">
                    {fmtUsd(e.priceCents)} <span className="font-sans text-base text-ink-soft">/ guest</span>
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {s.onSale ? `${s.seatsLeft} of ${s.capacity} seats open` : "Not on sale"} · demo inventory
                  </p>
                  <ReserveForm excursionId={e.id} unitCents={e.priceCents} seatsLeft={s.seatsLeft} feasible={s.feasibility.status !== "infeasible"} initialGuests={initialGuests} maxGuests={POLICY.maxGuests} />
                </div>
              </Reveal>
            </aside>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}

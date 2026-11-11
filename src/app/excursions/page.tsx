import { EXCURSIONS, PORTS, getPort } from "@/lib/domain/catalog";
import { fmtDuration, fmtMin, fmtUsd, toMin } from "@/lib/domain/time";
import type { Category } from "@/lib/domain/types";
import { availabilitySnapshot } from "@/lib/server/bookings";
import { SceneRoute } from "@/components/scene/SceneProvider";
import { ExcursionArt } from "@/components/excursion/ExcursionArt";
import { LastBoardTimeline } from "@/components/excursion/LastBoardTimeline";
import { TideLink } from "@/components/transition/TideTransition";
import { Reveal } from "@/components/ui/Reveal";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const dynamic = "force-dynamic";

const CATS: { id: Category; label: string }[] = [
  { id: "snorkel", label: "Snorkel" },
  { id: "sail", label: "Sailing" },
  { id: "nature", label: "Nature" },
  { id: "adventure", label: "Adventure" },
  { id: "culture", label: "Culture" },
  { id: "food", label: "Food" },
];

export default async function ExcursionsPage({ searchParams }: { searchParams: Promise<{ port?: string; category?: string }> }) {
  const sp = await searchParams;
  const port = sp.port && getPort(sp.port) ? sp.port : undefined;
  const category = CATS.some((c) => c.id === sp.category) ? (sp.category as Category) : undefined;
  const snap = await availabilitySnapshot();
  const list = EXCURSIONS.filter((e) => (!port || e.portId === port) && (!category || e.category === category));
  const portObj = port ? getPort(port) : undefined;
  const qs = (p?: string, c?: string) => {
    const u = new URLSearchParams();
    if (p) u.set("port", p);
    if (c) u.set("category", c);
    const s = u.toString();
    return `/excursions${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <SceneRoute scene={portObj?.scene === "sunset" ? "sunset" : "day"} />
      <section className="px-5 pb-12 pt-32 sm:px-10">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <p className="eyebrow">Explore · {portObj ? `${portObj.name}, ${portObj.country}` : "All ports"}</p>
            <h1 className="font-display mt-3 text-5xl leading-[1.02] sm:text-7xl">{portObj ? `Your day in ${portObj.name}.` : "Find your perfect port day."}</h1>
            {portObj && (
              <p className="mt-4 text-lg text-ink-soft">
                Ship in port {fmtMin(toMin(portObj.arrive))} to {fmtMin(toMin(portObj.allAboard))} (all aboard)
                {portObj.tender ? " · tender port" : ""}. Every tour below is checked against these times.
              </p>
            )}
          </Reveal>
          <nav className="mt-8 flex flex-wrap gap-2" aria-label="Filter by port">
            <TideLink href={qs(undefined, category)} className={`btn !py-2 text-sm ${!port ? "btn-primary" : "btn-ghost"}`} aria-current={!port ? "true" : undefined}>
              All ports
            </TideLink>
            {PORTS.map((p) => (
              <TideLink key={p.id} href={qs(p.id, category)} className={`btn !py-2 text-sm ${port === p.id ? "btn-primary" : "btn-ghost"}`} aria-current={port === p.id ? "true" : undefined}>
                {p.name}
              </TideLink>
            ))}
          </nav>
          <nav className="mt-3 flex flex-wrap gap-2" aria-label="Filter by category">
            <TideLink href={qs(port)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${!category ? "bg-white/15" : "text-ink-soft"}`}>
              Any style
            </TideLink>
            {CATS.map((c) => (
              <TideLink key={c.id} href={qs(port, c.id)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${category === c.id ? "bg-white/15" : "text-ink-soft"}`}>
                {c.label}
              </TideLink>
            ))}
          </nav>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-10">
        <div className="mx-auto grid max-w-[1400px] gap-6 md:grid-cols-2 xl:grid-cols-3">
          {list.length === 0 && (
            <div className="surface rounded-3xl p-10 md:col-span-2 xl:col-span-3">
              <p className="font-display text-3xl">No tours match that combination.</p>
              <p className="mt-2 text-ink-soft">Try another style or port.</p>
            </div>
          )}
          {list.map((e, i) => {
            const s = snap.find((x) => x.excursionId === e.id)!;
            const p = getPort(e.portId)!;
            return (
              <Reveal key={e.id} delay={(i % 3) * 0.06}>
                <TideLink href={`/excursions/${e.id}`} className="surface group block overflow-hidden rounded-[28px] transition duration-500 hover:-translate-y-1.5">
                  <div className="relative">
                    <ExcursionArt art={e.art} className="h-48 transition duration-700 group-hover:scale-[1.03]" />
                    <span className="absolute left-4 top-4 rounded-full bg-black/35 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-white uppercase backdrop-blur">
                      {p.name}
                    </span>
                  </div>
                  <div className="p-6">
                    <h2 className="font-display text-2xl leading-snug">{e.title}</h2>
                    <p className="mt-1.5 text-sm text-ink-soft">{e.tagline}</p>
                    <p className="mt-4 text-xs font-semibold text-ink-soft">
                      {e.startMode === "fixed" ? `Departs ${fmtMin(toMin(e.start))}` : `Flexible start ${fmtMin(toMin(e.start))}–${fmtMin(toMin(e.latestStart!))}`} ·{" "}
                      {fmtDuration(e.durationMin)} · {s.onSale ? `${s.seatsLeft} of ${s.capacity} seats open` : "Not on sale"}
                    </p>
                    <div className="mt-4">
                      <LastBoardTimeline f={s.feasibility} compact />
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-lg font-semibold">
                        {fmtUsd(e.priceCents)} <span className="text-sm font-normal text-ink-soft">/ guest</span>
                      </span>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-bold"
                        style={{
                          background:
                            s.feasibility.status === "infeasible"
                              ? "color-mix(in oklab, var(--warm) 25%, transparent)"
                              : "color-mix(in oklab, var(--accent) 22%, transparent)",
                        }}
                      >
                        {s.feasibility.status === "ok" ? "Fits schedule" : s.feasibility.status === "tight" ? "Tight fit" : "Doesn't fit today"}
                      </span>
                    </div>
                  </div>
                </TideLink>
              </Reveal>
            );
          })}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}

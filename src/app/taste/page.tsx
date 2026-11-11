import type { Metadata } from "next";
import { EXCURSIONS, getPort } from "@/lib/domain/catalog";
import { DEMO_VENUE, LOCAL_FLAVOURS } from "@/lib/domain/dining";
import { fmtDuration, fmtMin, fmtUsd, toMin } from "@/lib/domain/time";
import { availabilitySnapshot } from "@/lib/server/bookings";
import { SceneRoute } from "@/components/scene/SceneProvider";
import { MenuViewer } from "@/components/dining/MenuViewer";
import { DishArt } from "@/components/dining/DishArt";
import { AskMigoButton } from "@/components/dining/AskMigoButton";
import { ExcursionArt } from "@/components/excursion/ExcursionArt";
import { TideLink } from "@/components/transition/TideTransition";
import { Reveal } from "@/components/ui/Reveal";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Taste & Indulge · ShoreMigo" };

const SECTIONS = [
  ["flavours", "Local Flavours"],
  ["restaurants", "Restaurants"],
  ["tours", "Food Tours"],
  ["drinks", "Drinks & Cocktails"],
  ["desserts", "Desserts & Sweets"],
] as const;

export default async function TastePage() {
  const snap = await availabilitySnapshot();
  const tours = EXCURSIONS.filter((e) => e.category === "food");
  const drinks = DEMO_VENUE.sections.find((s) => s.id === "drinks")!.items;
  const desserts = DEMO_VENUE.sections.find((s) => s.id === "desserts")!.items;

  return (
    <>
      <SceneRoute scene="sunset" />
      <section className="px-5 pb-10 pt-32 sm:px-10">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <p className="eyebrow">Taste &amp; Indulge</p>
            <h1 className="font-display mt-3 max-w-4xl text-5xl leading-[1.02] sm:text-7xl">Eat like the islands do.</h1>
            <p className="mt-5 max-w-2xl text-lg text-ink-soft">
              Street food at breakfast, a slow lunch by the water, something sweet before all-aboard. Learn the dishes, browse a full sample menu, and book food
              experiences that fit your port time.
            </p>
          </Reveal>
          <nav className="mt-8 flex flex-wrap gap-2" aria-label="Taste & Indulge sections">
            {SECTIONS.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="btn btn-ghost !py-2 text-sm">
                {label}
              </a>
            ))}
            <AskMigoButton prompt="I have five hours in Cozumel. I want good local food, a dessert and some time at the beach. What fits my port time?" className="btn btn-primary !py-2 text-sm">
              Plan a food day with Migo
            </AskMigoButton>
          </nav>
        </div>
      </section>

      {/* Local flavours: factual guide */}
      <section id="flavours" className="scroll-mt-24 px-5 py-16 sm:px-10">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <p className="eyebrow">Local Flavours · dish guide</p>
            <h2 className="font-display mt-2 text-4xl sm:text-5xl">What to look for, port by port.</h2>
            <p className="mt-3 max-w-2xl text-ink-soft">A short guide to dishes you&apos;ll meet on this route and in Trinidad &amp; Tobago. Descriptions only: no venues or prices are implied.</p>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {LOCAL_FLAVOURS.filter((d) => d.kind !== "drink").map((d, i) => (
              <Reveal key={d.id} delay={(i % 4) * 0.05}>
                <article className="surface h-full overflow-hidden rounded-[24px]">
                  <div className="aspect-[4/3]">
                    <DishArt tone={d.tone} kind={d.kind} />
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">{d.region}</p>
                    <h3 className="font-display mt-1 text-2xl">{d.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{d.description}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Restaurant + interactive menu */}
      <section id="restaurants" className="scroll-mt-24 px-5 py-16 sm:px-10">
        <div className="mx-auto grid max-w-[1400px] gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <p className="eyebrow">Restaurants</p>
            <h2 className="font-display mt-2 text-4xl sm:text-5xl">Open the menu.</h2>
            <p className="mt-3 text-ink-soft">
              Tidewalk Kitchen is a <strong>fictional demo venue</strong> that shows how ShoreMigo presents a full menu: breakfast to dessert, local specialties linked to
              the dish guide, drinks with clear alcohol labels.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-ink-soft">
              <li>◆ Informational listing: not a reservation integration</li>
              <li>◆ Sample prices in USD, for illustration</li>
              <li>◆ Real restaurant partners would appear only once verified</li>
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <MenuViewer venue={DEMO_VENUE} />
          </Reveal>
        </div>
      </section>

      {/* Bookable food tours: live inventory */}
      <section id="tours" className="scroll-mt-24 px-5 py-16 sm:px-10">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <p className="eyebrow">Food Tours · bookable</p>
            <h2 className="font-display mt-2 text-4xl sm:text-5xl">Taste it with a guide.</h2>
            <p className="mt-3 max-w-2xl text-ink-soft">Real demo inventory: live seats, server-side prices and a LastBoard check against your ship&apos;s schedule, then PayPal (sandbox) checkout.</p>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {tours.map((e) => {
              const s = snap.find((x) => x.excursionId === e.id)!;
              const port = getPort(e.portId)!;
              return (
                <TideLink key={e.id} href={`/excursions/${e.id}`} className="surface group grid overflow-hidden rounded-[28px] transition hover:-translate-y-1 sm:grid-cols-[0.9fr_1.1fr]">
                  <div className="relative min-h-48">
                    <ExcursionArt art={e.art} />
                  </div>
                  <div className="p-6">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">
                      {port.name} · Tidewalk Tours (demo operator)
                    </p>
                    <h3 className="font-display mt-1 text-2xl">{e.title}</h3>
                    <p className="mt-2 text-sm text-ink-soft">{e.tagline}</p>
                    <p className="mt-3 text-xs font-semibold text-ink-soft">
                      Departs {fmtMin(toMin(e.start))} · {fmtDuration(e.durationMin)} · {s.onSale ? `${s.seatsLeft} of ${s.capacity} seats open` : "Not on sale"} · fit:{" "}
                      {s.feasibility.status}
                    </p>
                    <p className="mt-4 text-lg font-semibold">
                      {fmtUsd(e.priceCents)} <span className="text-sm font-normal text-ink-soft">per guest</span>
                    </p>
                  </div>
                </TideLink>
              );
            })}
            <div className="surface rounded-[28px] p-6 text-sm text-ink-soft">
              <p className="font-display text-2xl text-ink">More food experiences</p>
              <p className="mt-2">
                Only experiences with operator inventory are bookable. More tastings (a Port of Spain street-food walk, a Grand Cayman fish-fry) are on the roadmap and
                will appear here once inventory exists.
              </p>
              <TideLink href="/excursions?mood=relax" className="btn btn-ghost mt-4 !py-2 text-sm">
                Pair it with a beach afternoon →
              </TideLink>
            </div>
          </div>
        </div>
      </section>

      {/* Drinks */}
      <section id="drinks" className="scroll-mt-24 px-5 py-16 sm:px-10">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <p className="eyebrow">Drinks &amp; Cocktails</p>
            <h2 className="font-display mt-2 text-4xl sm:text-5xl">Something cold, something local.</h2>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LOCAL_FLAVOURS.filter((d) => d.kind === "drink").map((d) => (
              <article key={d.id} className="surface flex gap-4 rounded-[24px] p-5">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                  <DishArt tone={d.tone} kind="drink" />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">{d.region} · guide</p>
                  <h3 className="font-display text-xl">{d.name}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{d.description}</p>
                </div>
              </article>
            ))}
            {drinks
              .filter((d) => !d.dishId)
              .map((d) => (
                <article key={d.name} className="surface rounded-[24px] p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-semibold">{d.name}</h3>
                    <span className="text-sm text-accent">{fmtUsd(d.priceCents)} · sample</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">{d.description}</p>
                  <p className="mt-2 text-[10px] font-bold tracking-wide text-ink-soft uppercase">{d.tags?.includes("contains-alcohol") ? "Contains alcohol · legal drinking age only" : "Non-alcoholic"}</p>
                </article>
              ))}
          </div>
        </div>
      </section>

      {/* Desserts */}
      <section id="desserts" className="scroll-mt-24 px-5 pb-24 pt-16 sm:px-10">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <p className="eyebrow">Desserts &amp; Sweets</p>
            <h2 className="font-display mt-2 text-4xl sm:text-5xl">Save room.</h2>
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {desserts.map((d, i) => (
              <Reveal key={d.name} delay={i * 0.05}>
                <article className="surface h-full overflow-hidden rounded-[24px]">
                  <div className="aspect-square">
                    <DishArt tone={i % 2 ? ["#f4c777", "#8a3b2a"] : ["#f69a8e", "#5e1f2a"]} kind="sweet" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{d.name}</h3>
                    <p className="mt-1 text-xs text-ink-soft">{d.description}</p>
                    <p className="mt-2 text-sm text-accent">{fmtUsd(d.priceCents)} · sample</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}

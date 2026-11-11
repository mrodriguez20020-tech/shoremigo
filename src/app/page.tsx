import { SAILING, getExcursion } from "@/lib/domain/catalog";
import { fmtUsd } from "@/lib/domain/time";
import { SceneRoute } from "@/components/scene/SceneProvider";
import { SceneSection } from "@/components/home/SceneSection";
import { PortCards } from "@/components/home/PortCards";
import { AdventureMatch } from "@/components/home/AdventureMatch";
import { RescueStory } from "@/components/home/RescueStory";
import { HomeWelcome } from "@/components/home/HomeWelcome";
import { HeroActions } from "@/components/home/HeroActions";
import { PortDayClock } from "@/components/home/PortDayClock";
import { Reveal } from "@/components/ui/Reveal";
import { TideLink } from "@/components/transition/TideTransition";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function Home() {
  const sunset = getExcursion("och-sunset-sail")!;
  return (
    <>
      <SceneRoute scene="day" />
      <HomeWelcome />

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative flex min-h-dvh items-center px-5 pb-32 pt-28 sm:px-10">
        <div className="mx-auto grid w-full max-w-[1400px] items-center gap-12 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <Reveal>
              <p className="eyebrow flex flex-wrap items-center gap-3">
                <span>
                  {SAILING.ship} · {SAILING.name}
                </span>
                <span className="demo-tag">Demo sailing</span>
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="font-display mt-6 max-w-[14ch] text-[clamp(2.9rem,6.2vw,6.2rem)] leading-[0.94] tracking-[-0.03em] [text-shadow:0_2px_40px_rgba(4,30,50,0.35)]">
                Your adventure doesn&apos;t stop when{" "}
                <em className="shimmer-text not-italic sm:italic">
                  plans change.
                </em>
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl [text-shadow:0_1px_20px_rgba(4,30,50,0.4)]">
                ShoreMigo finds shore excursions that fit your ship&apos;s real
                schedule, books them with PayPal, and if your ship runs late,
                rescues your day with an alternative that still works.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <HeroActions />
            </Reveal>
            <Reveal delay={0.45}>
              <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-ink-soft">
                <li>◆ PayPal sandbox checkout</li>
                <li>◆ LastBoard schedule engine</li>
                <li>◆ AI concierge with verified tools</li>
              </ul>
            </Reveal>
          </div>
          <Reveal delay={0.5} className="hidden self-start xl:mt-10 xl:block" y={40}>
            <PortDayClock />
          </Reveal>
        </div>
        <a
          href="#ports"
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-xs font-bold tracking-[0.3em] text-ink-soft uppercase"
          aria-label="Scroll to ports"
        >
          <span className="block animate-[bob_2.6s_ease-in-out_infinite]">
            Scroll ↓
          </span>
        </a>
      </section>

      {/* ── Ports ──────────────────────────────────────── */}
      <section id="ports" className="relative px-5 py-24 sm:px-10">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <p className="eyebrow">Four ports · one week</p>
            <h2 className="font-display mt-3 max-w-3xl text-5xl leading-[1.02] sm:text-6xl">
              Every port call, matched to the minute.
            </h2>
            <p className="mt-5 max-w-2xl text-lg text-ink-soft">
              Port time is short and fixed. Every tour on ShoreMigo is checked
              against the ship&apos;s arrival and all-aboard times before you
              can book it.
            </p>
          </Reveal>
          <Reveal className="mt-10 max-w-2xl xl:hidden">
            <PortDayClock />
          </Reveal>
          <div className="mt-12">
            <PortCards />
          </div>
        </div>
      </section>

      {/* ── Adventure Match ───────────────────────────── */}
      <SceneSection
        scene="shade"
        id="match"
        className="relative scroll-mt-24 px-5 py-24 sm:px-10"
        threshold={0.35}
      >
        <div className="mx-auto max-w-[1400px]">
          <AdventureMatch />
        </div>
      </SceneSection>

      {/* ── Golden Hour (signature sunset scene) ───────── */}
      <SceneSection
        scene="sunset"
        className="relative flex min-h-[130vh] items-center px-5 py-32 sm:px-10"
        threshold={0.4}
      >
        <div className="mx-auto grid w-full max-w-[1400px] items-end gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <Reveal>
            <p className="eyebrow">Ocho Rios · golden hour</p>
            <h2 className="font-display mt-4 text-[clamp(3rem,7vw,6.5rem)] leading-[0.95] tracking-[-0.02em] [text-shadow:0_4px_60px_rgba(80,20,40,0.45)]">
              The sun goes down.
              <br />
              <em className="text-accent">The day doesn&apos;t end.</em>
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              An evening port call means a sail into the sunset with the island
              glowing behind you. LastBoard confirms you&apos;re back at the
              pier 60 minutes before all-aboard, so you can just watch the
              light.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <TideLink
              href={`/excursions/${sunset.id}`}
              className="surface group block rounded-[28px] p-7 transition hover:-translate-y-1"
            >
              <p className="eyebrow">Featured excursion</p>
              <p className="font-display mt-2 text-3xl">{sunset.title}</p>
              <p className="mt-2 text-ink-soft">{sunset.tagline}</p>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-lg font-semibold">
                  {fmtUsd(sunset.priceCents)} / guest
                </span>
                <span className="btn btn-primary !py-2 text-sm">
                  See timing →
                </span>
              </div>
            </TideLink>
          </Reveal>
        </div>
      </SceneSection>

      {/* ── LastBoard / Trip Rescue ───────────────────── */}
      <SceneSection
        scene="night"
        className="relative px-5 py-32 sm:px-10"
        threshold={0.3}
      >
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <p className="eyebrow">Trip Rescue, powered by LastBoard</p>
            <h2 className="font-display mt-3 max-w-4xl text-5xl leading-[1.02] sm:text-6xl">
              When the ship runs late, your day gets rescued, not cancelled.
            </h2>
            <p className="mt-5 max-w-2xl text-lg text-ink-soft">
              LastBoard is our deterministic schedule engine. It recalculates
              every booking against the new arrival time, finds alternatives
              that still fit, and hands them to Migo to explain. You approve.
              PayPal settles the difference.
            </p>
          </Reveal>
          <div className="mt-12">
            <RescueStory />
          </div>
        </div>
      </SceneSection>

      {/* ── What's real ───────────────────────────────── */}
      <section className="relative px-5 py-24 sm:px-10">
        <div className="mx-auto grid max-w-[1400px] gap-6 md:grid-cols-2">
          <Reveal className="surface rounded-[28px] p-8">
            <p className="eyebrow">Real, working systems</p>
            <ul className="mt-5 space-y-3 text-ink-soft">
              <li>
                <strong className="text-ink">
                  PayPal Orders v2 + Payments v2 (sandbox).
                </strong>{" "}
                Orders, captures and refunds are created server-side and
                verified before any booking changes.
              </li>
              <li>
                <strong className="text-ink">LLM tool calling.</strong> Migo
                answers through approved read-only tools. He can prepare a
                booking but never charge or refund.
              </li>
              <li>
                <strong className="text-ink">LastBoard.</strong> Deterministic
                feasibility and rescue planning, covered by automated tests.
              </li>
              <li>
                <strong className="text-ink">Audit trail.</strong> Every
                booking, payment and rescue event is recorded for operators.
              </li>
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="surface rounded-[28px] p-8">
            <p className="eyebrow">Demo data, clearly labeled</p>
            <ul className="mt-5 space-y-3 text-ink-soft">
              <li>
                The ship &ldquo;{SAILING.ship}&rdquo;, its sailing and timetable
                are fictional. Port names are real places.
              </li>
              <li>
                Tours, guides, vehicles, meeting points and prices are sample
                inventory.
              </li>
              <li>
                Ship delays are simulations triggered by a labeled control.
                There is no live ship tracking.
              </li>
              <li>Payments use PayPal&apos;s sandbox. No real money moves.</li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── Crew preview (future) ─────────────────────── */}
      <section className="relative px-5 pb-40 pt-8 sm:px-10">
        <Reveal className="surface mx-auto max-w-[1400px] rounded-[28px] p-8 sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <p className="eyebrow">ShoreMigo Crew</p>
            <span className="rounded-full border border-line px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-ink-soft uppercase">
              Concept preview · not live
            </span>
          </div>
          <p className="font-display mt-3 max-w-3xl text-3xl leading-snug">
            For cruise creators, travel writers and local guides: curate a
            collection, share a link, and earn on the bookings it inspires.
          </p>
          <ol className="mt-6 grid gap-4 text-sm text-ink-soft sm:grid-cols-4">
            <li>01 · Create an excursion collection</li>
            <li>02 · Share your referral link</li>
            <li>03 · Qualifying bookings are attributed</li>
            <li>04 · Commission is calculated</li>
          </ol>
        </Reveal>
      </section>

      <SiteFooter />
    </>
  );
}

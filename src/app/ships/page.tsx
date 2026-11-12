import type { Metadata } from "next";
import { SceneRoute } from "@/components/scene/SceneProvider";
import { ShipExplorer } from "@/components/ship/ShipExplorer";
import { TideLink } from "@/components/transition/TideTransition";
import { Reveal } from "@/components/ui/Reveal";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = { title: "Ships & Rooms · ShoreMigo" };

export default function ShipsPage() {
  return (
    <>
      <SceneRoute scene="shade" />
      <section className="px-5 pb-24 pt-32 sm:px-10">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <p className="eyebrow flex flex-wrap items-center gap-3">
              <span>Ships &amp; Rooms</span>
              <span className="demo-tag">Fictional vessel · provisional design</span>
            </p>
            <h1 className="font-display mt-3 max-w-4xl text-5xl leading-[1.02] sm:text-7xl">Step aboard the Aurora Tide.</h1>
            <p className="mt-5 max-w-2xl text-lg text-ink-soft">
              Nine decks, 104 staterooms and one signature cabin to explore. Walk the decks, step inside Cabin 7214 and browse the onboard menus before you sail. A
              fictional ship shows how ShoreMigo connects your vessel to your port days.
            </p>
          </Reveal>
          <div className="mt-10">
            <ShipExplorer />
          </div>
          <Reveal className="mt-14">
            <div className="surface flex flex-col items-start gap-4 rounded-[28px] p-7 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-3xl">Explore what awaits at your next port.</p>
                <p className="mt-1 text-ink-soft">Four port calls this week, every tour checked against the Aurora Tide&apos;s schedule.</p>
              </div>
              <TideLink href="/excursions" className="btn btn-primary">
                Explore port days →
              </TideLink>
            </div>
          </Reveal>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}

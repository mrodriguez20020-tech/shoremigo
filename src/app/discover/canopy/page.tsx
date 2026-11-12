import type { Metadata } from "next";
import { SceneRoute } from "@/components/scene/SceneProvider";
import { DiscoveryExperience } from "@/components/discovery/DiscoveryExperience";
import { DiscoveryPhoto } from "@/components/discovery/DiscoveryPhoto";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = { title: "Rainforest & canopy · ShoreMigo" };

export default function Page() {
  return (
    <>
      <SceneRoute scene="day" />
      <DiscoveryExperience id="canopy" />
      <DiscoveryPhoto id="canopy" />
      <SiteFooter />
    </>
  );
}

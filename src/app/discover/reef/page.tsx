import type { Metadata } from "next";
import { SceneRoute } from "@/components/scene/SceneProvider";
import { DiscoveryExperience } from "@/components/discovery/DiscoveryExperience";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = { title: "Underwater discovery · ShoreMigo" };

export default function Page() {
  return (
    <>
      <SceneRoute scene="shade" />
      <DiscoveryExperience id="reef" />
      <SiteFooter />
    </>
  );
}

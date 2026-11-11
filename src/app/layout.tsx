import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { AudioProvider } from "@/components/audio/AudioProvider";
import { ConciergePanel } from "@/components/concierge/ConciergePanel";
import { Intro } from "@/components/intro/Intro";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CompanionProvider } from "@/components/migo/CompanionProvider";
import { MigoStage } from "@/components/migo/MigoStage";
import { SceneBackdrop } from "@/components/scene/SceneBackdrop";
import { SceneProvider } from "@/components/scene/SceneProvider";
import { TideProvider } from "@/components/transition/TideTransition";

// Both fonts are SIL Open Font License, self-hosted at build time by next/font.
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["SOFT", "opsz"], style: ["normal", "italic"] });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "ShoreMigo · Cruise shore excursions that adapt with you",
  description:
    "Discover shore excursions that fit your ship's schedule, book with PayPal, and recover gracefully when plans change, with Migo, your AI cruise companion.",
};

export const viewport: Viewport = { themeColor: "#071a2c", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scene="day" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="min-h-dvh">
        <SceneProvider>
          <AudioProvider>
            <CompanionProvider>
              <TideProvider>
                <SceneBackdrop />
                <SiteHeader />
                <main id="main" className="relative z-10">
                  {children}
                </main>
                <MigoStage />
                <ConciergePanel />
                <Intro />
              </TideProvider>
            </CompanionProvider>
          </AudioProvider>
        </SceneProvider>
      </body>
    </html>
  );
}

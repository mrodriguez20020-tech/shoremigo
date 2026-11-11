import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
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
import { PrefsProvider } from "@/components/prefs/PrefsProvider";
import { WelcomePortal } from "@/components/prefs/WelcomePortal";

// SIL Open Font License; bundled locally so production builds need no font-service network access.
const fraunces = localFont({
  src: [
    { path: "./fonts/Fraunces.ttf", style: "normal", weight: "100 900" },
    { path: "./fonts/Fraunces-Italic.ttf", style: "italic", weight: "100 900" },
  ],
  variable: "--font-fraunces", display: "swap",
});
const manrope = localFont({ src: "./fonts/Manrope.ttf", weight: "200 800", variable: "--font-manrope", display: "swap" });

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
        <PrefsProvider>
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
                <WelcomePortal />
              </TideProvider>
            </CompanionProvider>
          </AudioProvider>
        </SceneProvider>
        </PrefsProvider>
      </body>
    </html>
  );
}

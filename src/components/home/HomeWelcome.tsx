"use client";

import { useEffect } from "react";
import { migo } from "@/components/migo/bus";
import { INTRO_DONE_EVENT } from "@/components/intro/Intro";
import { track } from "@/lib/client/track";

/** After the intro finishes, Migo waves and offers (once) to help. Fully dismissible. */
export function HomeWelcome() {
  useEffect(() => {
    let fired = false;
    const go = () => {
      if (fired) return;
      fired = true;
      setTimeout(() => {
        migo.emit({ type: "app:arrived" });
        migo.emit({
          type: "suggest",
          key: "welcome",
          text: "Hi, I'm Migo, ShoreMigo's AI companion! I find shore excursions that actually fit your ship's schedule. Want to try Adventure Match?",
          href: "#match",
          cta: "Let's go",
        });
        track("welcome.shown", { page: "home" });
      }, 500);
    };
    window.addEventListener(INTRO_DONE_EVENT, go);
    const fallback = setTimeout(go, 3500);
    return () => {
      window.removeEventListener(INTRO_DONE_EVENT, go);
      clearTimeout(fallback);
    };
  }, []);
  return null;
}

"use client";

import { useEffect } from "react";
import { migo } from "@/components/migo/bus";
import { INTRO_DONE_EVENT } from "@/components/intro/Intro";
import { track } from "@/lib/client/track";
import { usePrefs } from "@/components/prefs/PrefsProvider";

/**
 * Returning visitors: after the intro, Migo waves and offers (once) to help,
 * in the visitor's language. First-time visitors are greeted by the
 * WelcomePortal instead. Fully dismissible.
 */
export function HomeWelcome() {
  const { prefs, ready, t } = usePrefs();
  useEffect(() => {
    if (!ready || !prefs.welcomed) return;
    let fired = false;
    const go = () => {
      if (fired) return;
      fired = true;
      setTimeout(() => {
        migo.emit({ type: "app:arrived" });
        migo.emit({ type: "suggest", key: "welcome", text: t("migo.greeting"), href: "#discover", cta: t("migo.cta") });
        track("welcome.shown", { page: "home" });
      }, 500);
    };
    window.addEventListener(INTRO_DONE_EVENT, go);
    const fallback = setTimeout(go, 3500);
    return () => {
      window.removeEventListener(INTRO_DONE_EVENT, go);
      clearTimeout(fallback);
    };
    // Run once when preferences load; language changes don't re-greet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  return null;
}

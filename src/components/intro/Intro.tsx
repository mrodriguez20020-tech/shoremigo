"use client";

import { OceanScene } from "@/components/scene/OceanScene";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { useCompanion } from "@/components/migo/CompanionProvider";

export const INTRO_DONE_EVENT = "sm:intro-done";
const reportDone = () => {
  document.documentElement.dataset.intro = "done";
  window.dispatchEvent(new Event(INTRO_DONE_EVENT));
};

/** A short, skippable establishing shot. Preferences and Migo follow without a second loading screen. */
export function Intro() {
  const [show, setShow] = useState(false);
  const { reducedMotion } = useCompanion();
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("sm.intro") === "1";
      sessionStorage.setItem("sm.intro", "1");
    } catch {}
    if (
      seen ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "reduced"
    ) {
      reportDone();
      return;
    }
    setShow(true);
  }, []);
  useEffect(() => {
    if (!show) return;
    const end = () => setShow(false);
    const timer = setTimeout(end, reducedMotion ? 0 : 800);
    window.addEventListener("keydown", end);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", end);
    };
  }, [show, reducedMotion]);
  return (
    <AnimatePresence onExitComplete={reportDone}>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] bg-[#071d25]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.35 }}
        >
          <OceanScene variant="intro" />
          <div className="absolute inset-0 flex flex-col items-center justify-center intro-brand-shade px-6 text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Wordmark className="text-[clamp(2.8rem,7vw,6rem)] text-[#fff7eb]" />
            </motion.div>
            <div className="mt-7 h-px w-24 bg-[#e8c895]" />
          </div>
          <button
            className="welcome-skip absolute bottom-8 right-8"
            onClick={() => setShow(false)}
          >
            Skip <span aria-hidden>→</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

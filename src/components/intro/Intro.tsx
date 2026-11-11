"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { SpriteMigo } from "@/components/migo/SpriteMigo";
import { Wordmark } from "@/components/brand/Wordmark";

/**
 * Opening sequence (~2.6s, once per browser session, skippable with any
 * click or key). The page is already rendered underneath; this never delays
 * data or hydration. Reduced motion → a 0.4s wordmark fade.
 *
 *  0.0s  midnight sea; a horizon line of light draws outward
 *  0.5s  compass-glow sunrise lifts through sea mist
 *  0.8s  ShoreMigo wordmark resolves letter by letter
 *  1.2s  Migo emerges from the glow
 *  2.2s  the horizon splits open, revealing the living scene
 */
export const INTRO_DONE_EVENT = "sm:intro-done";

export function Intro() {
  const [show, setShow] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("sm.intro") === "1";
      sessionStorage.setItem("sm.intro", "1");
    } catch {}
    if (seen) {
      window.dispatchEvent(new Event(INTRO_DONE_EVENT));
      return;
    }
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setShow(true);
  }, []);

  useEffect(() => {
    if (!show) return;
    const end = () => setShow(false);
    const t = setTimeout(end, reduced ? 900 : 2600);
    window.addEventListener("keydown", end);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", end);
    };
  }, [show, reduced]);

  return (
    <AnimatePresence onExitComplete={() => window.dispatchEvent(new Event(INTRO_DONE_EVENT))}>
      {show && (
        <motion.div key="intro" className="fixed inset-0 z-[100] cursor-pointer" onClick={() => setShow(false)} role="presentation" aria-hidden>
          {/* Two halves split at the horizon on exit */}
          <motion.div
            className="absolute inset-x-0 top-0 h-1/2 overflow-hidden"
            exit={reduced ? { opacity: 0 } : { y: "-100%" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            style={{ background: "linear-gradient(to bottom, #020814, #071a32 70%, #0d2c4c)" }}
          >
            <motion.div
              className="absolute bottom-0 left-1/2 h-[46vmin] w-[46vmin] -translate-x-1/2 translate-y-1/2 rounded-full"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, duration: 1.2, ease: "easeOut" }}
              style={{ background: "radial-gradient(closest-side, rgba(255,210,122,0.75), rgba(255,160,90,0.25) 55%, transparent)" }}
            />
            <div className="absolute inset-x-0 bottom-[8%] flex flex-col items-center">
              <motion.div
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 30, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: reduced ? 0 : 1.15, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                className="mb-2"
              >
                <SpriteMigo pose="wave" size={112} reflection={false} />
              </motion.div>
              <Wordmark animate={!reduced} className="text-[clamp(2.4rem,7vw,5.5rem)] text-[#fbf3e2]" />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ delay: reduced ? 0 : 1.5, duration: 0.8 }}
                className="mt-2 text-center text-sm tracking-[0.2em] text-[#f3d9a4] uppercase"
              >
                Your adventure doesn&apos;t stop when plans change
              </motion.p>
            </div>
          </motion.div>
          <motion.div
            className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden"
            exit={reduced ? { opacity: 0 } : { y: "100%" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            style={{ background: "linear-gradient(to bottom, #12304d, #061426 40%, #020814)" }}
          >
            {/* reflection of the glow on the water */}
            <motion.div
              className="absolute left-1/2 top-0 h-full w-[30vmin] -translate-x-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ delay: 0.7, duration: 1.2 }}
              style={{
                background: "repeating-linear-gradient(to bottom, rgba(255,200,120,0.55) 0 2px, transparent 2px 9px)",
                WebkitMaskImage: "linear-gradient(to bottom, black, transparent 80%), radial-gradient(closest-side, black, transparent)",
                maskImage: "linear-gradient(to bottom, black, transparent 80%)",
                filter: "blur(0.6px)",
              }}
            />
            <div className="absolute inset-x-0 top-0 h-24" style={{ background: "linear-gradient(to bottom, rgba(180,210,255,0.18), transparent)" }} />
          </motion.div>
          {/* horizon line of light */}
          <motion.div
            className="absolute inset-x-0 top-1/2 h-px origin-center"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.9, ease: [0.65, 0, 0.35, 1] }}
            style={{ background: "linear-gradient(90deg, transparent, #ffe2a8, transparent)", boxShadow: "0 0 30px 4px rgba(255,200,120,0.45)" }}
          />
          <button
            className="absolute bottom-6 right-6 rounded-full border border-white/20 px-4 py-2 text-xs tracking-widest text-white/70 uppercase backdrop-blur hover:text-white"
            onClick={() => setShow(false)}
          >
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

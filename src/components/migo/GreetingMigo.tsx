"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue } from "motion/react";
import { useCompanion } from "./CompanionProvider";
import { SpriteMigo } from "./SpriteMigo";
import { gaitAt, ANTICIPATION_MS, STRIDE_MS } from "./gait";

/** Faithful two-pose entrance; no invented facial/boot articulation. Controls never wait for it. */
export function GreetingMigo() {
  const { reducedMotion } = useCompanion();
  const [phase, setPhase] = useState<"notice" | "step" | "wave">("notice");
  const [frame, setFrame] = useState<0 | 1>(0);
  const [contact, setContact] = useState(false);
  const travel = useMotionValue(-30.6);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reducedMotion) {
      setPhase("wave");
      travel.set(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const gait = gaitAt(elapsed, 180);
      if (elapsed >= ANTICIPATION_MS + STRIDE_MS * 2) {
        setPhase("wave");
        setContact(true);
        travel.set(0);
        return;
      }
      setPhase(gait.phase === "anticipation" ? "notice" : "step");
      setFrame(gait.frame);
      setContact(gait.contact);
      travel.set(-30.6 + gait.offset);
      if (root.current) root.current.dataset.contact = String(gait.contact);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion, travel]);
  return (
    <motion.div
      ref={root}
      style={{ x: travel }}
      data-greeting-phase={phase}
      data-gait-frame={frame}
      className="greeting-character"
    >
      <SpriteMigo
        pose={
          phase === "notice"
            ? "think"
            : phase === "step"
              ? frame
                ? "walk-b"
                : "walk-a"
              : "wave"
        }
        size={180}
        reflection={false}
        contact={contact ? 1 : 0.6}
      />
    </motion.div>
  );
}

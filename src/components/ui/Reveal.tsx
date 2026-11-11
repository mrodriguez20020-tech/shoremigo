"use client";

import { motion } from "motion/react";
import { useCompanion } from "@/components/migo/CompanionProvider";
import type { ReactNode } from "react";

/** Elegant scroll reveal. Motion respects prefers-reduced-motion via MotionConfig defaults + our global CSS. */
export function Reveal({ children, delay = 0, className = "", y = 28 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  const { reducedMotion } = useCompanion();
  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: reducedMotion ? 0 : 0.65, delay: reducedMotion ? 0 : delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

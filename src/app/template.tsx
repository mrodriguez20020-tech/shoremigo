"use client";

import { motion } from "motion/react";

/** Per-route entrance: content surfaces from the horizon as the tide recedes. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0, transitionEnd: { transform: "none" } }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

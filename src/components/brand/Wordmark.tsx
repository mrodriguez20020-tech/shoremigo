"use client";

import { motion } from "motion/react";

/** Compass-star mark: original vector, echoes Migo's golden compass. */
export function CompassMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <radialGradient id="cm-g" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#fff3cf" />
          <stop offset="70%" stopColor="#f3c463" />
          <stop offset="100%" stopColor="#c98a2c" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="14.5" fill="url(#cm-g)" stroke="#8a5a1c" strokeOpacity="0.5" />
      <path d="M16 4 L18.4 16 L16 28 L13.6 16 Z" fill="#14324a" />
      <path d="M4 16 L16 13.6 L28 16 L16 18.4 Z" fill="#14324a" opacity="0.75" />
      <path d="M16 4 L18.4 16 L13.6 16 Z" fill="#e8553b" />
      <circle cx="16" cy="16" r="1.8" fill="#fff3cf" />
    </svg>
  );
}

export function Wordmark({ className = "", animate = false }: { className?: string; animate?: boolean }) {
  const letters = "ShoreMigo".split("");
  return (
    <span className={`font-display font-medium tracking-[-0.02em] ${className}`} role="img" aria-label="ShoreMigo">
      {letters.map((l, i) =>
        animate ? (
          <motion.span
            key={i}
            aria-hidden
            className={`inline-block ${i >= 5 ? "italic" : ""}`}
            initial={{ opacity: 0, y: "0.4em", filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.75 + i * 0.05, duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {l}
          </motion.span>
        ) : (
          <span key={i} aria-hidden className={i >= 5 ? "italic" : ""}>
            {l}
          </span>
        ),
      )}
    </span>
  );
}

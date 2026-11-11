"use client";

import { useCompanion } from "@/components/migo/CompanionProvider";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { PORTS, excursionsForPort } from "@/lib/domain/catalog";
import { fmtMin, toMin } from "@/lib/domain/time";
import type { PortCall } from "@/lib/domain/types";
import { TideLink } from "@/components/transition/TideTransition";
import { Reveal } from "@/components/ui/Reveal";

export function PortCards() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {PORTS.map((p, i) => (
        <Reveal key={p.id} delay={i * 0.08}>
          <PortCard port={p} />
        </Reveal>
      ))}
    </div>
  );
}

function PortCard({ port }: { port: PortCall }) {
  const { reducedMotion } = useCompanion();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-8, 8]), { stiffness: 150, damping: 18 });
  const glowX = useTransform(mx, (v) => `${v * 100}%`);
  const glowY = useTransform(my, (v) => `${v * 100}%`);
  const count = excursionsForPort(port.id).length;

  return (
    <TideLink href={`/excursions?port=${port.id}`} className="block [perspective:900px]" aria-label={`${port.name}: ${count} excursions`}>
      <motion.div
        onPointerMove={(e) => {
          if (reducedMotion) return;
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width);
          my.set((e.clientY - r.top) / r.height);
        }}
        onPointerLeave={() => {
          mx.set(0.5);
          my.set(0.5);
        }}
        style={{ rotateX: reducedMotion ? 0 : rx, rotateY: reducedMotion ? 0 : ry, background: `linear-gradient(165deg, ${port.art.from}, ${port.art.to})` }}
        whileHover={reducedMotion ? undefined : { y: -6 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-[28px] p-6 text-[#fffaf1] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)] [transform-style:preserve-3d]"
      >
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: useTransform([glowX, glowY], ([x, y]) => `radial-gradient(400px circle at ${x} ${y}, rgba(255,255,255,0.22), transparent 45%)`) }}
        />
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-70 blur-2xl" style={{ background: port.art.accent }} />
        <svg className="absolute inset-x-0 bottom-[36%] w-full opacity-40" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden>
          <path d="M0 40 C60 10 120 50 200 30 C280 10 340 40 400 25 L400 60 L0 60Z" fill="rgba(0,0,0,0.35)" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="relative [transform:translateZ(40px)]">
          <p className="text-[11px] font-bold tracking-[0.24em] uppercase opacity-80">
            {new Date(port.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {port.country}
          </p>
          <h3 className="font-display mt-1 text-4xl leading-none">{port.name}</h3>
          <p className="mt-3 text-sm leading-relaxed opacity-85">{port.blurb}</p>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold">
            <span>
              In port {fmtMin(toMin(port.arrive))} – {fmtMin(toMin(port.allAboard))}
            </span>
            <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">{count} tours</span>
          </div>
        </div>
      </motion.div>
    </TideLink>
  );
}

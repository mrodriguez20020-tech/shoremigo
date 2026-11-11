"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useMemo, useRef } from "react";

/**
 * Full-bleed, original vector environment. No stock photos: every layer is
 * drawn here and colored by the active scene's CSS variables, so the same
 * world becomes tropical daylight, jungle shade, golden-hour sunset, moonlit
 * evening or a calm neutral checkout.
 *
 * Depth (back → front): sky · stars · sun bloom · clouds · far islands + ship ·
 * sea · glitter path · wave lines · mist · palms (scroll parallax) · vignette.
 * Pointer parallax writes two CSS vars; everything animates on the compositor.
 */
const HORIZON = 62; // % from top

function seeded(n: number) {
  let s = n * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

export function SceneBackdrop() {
  const root = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const palmY = useTransform(scrollY, [0, 1200], [0, -120]);
  const islandY = useTransform(scrollY, [0, 1200], [0, -30]);

  const stars = useMemo(() => {
    const r = seeded(7);
    return Array.from({ length: 70 }, () => ({ x: r() * 100, y: r() * HORIZON * 0.85, s: r() * 1.6 + 0.6, d: r() * 4 + 2, delay: r() * 4 }));
  }, []);

  const glints = useMemo(() => {
    const r = seeded(3);
    return Array.from({ length: 38 }, (_, i) => {
      const depth = i / 37; // 0 = horizon, 1 = foreground
      return {
        top: Math.pow(depth, 1.35) * 100,
        w: 3 + Math.pow(depth, 1.4) * 34 + r() * 6,
        off: (r() - 0.5) * (2 + depth * 18),
        h: 0.18 + depth * 0.7,
        a: 0.35 + r() * 0.65,
        dur: 2 + r() * 3.5,
        delay: r() * 3,
      };
    });
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--px", ((e.clientX / window.innerWidth - 0.5) * 2).toFixed(3));
        el.style.setProperty("--py", ((e.clientY / window.innerHeight - 0.5) * 2).toFixed(3));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const par = (n: number) => ({ transform: `translate3d(calc(var(--px, 0) * ${n}px), calc(var(--py, 0) * ${n * 0.4}px), 0)` });

  return (
    <div ref={root} className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* sky */}
      <div className="absolute inset-x-0 top-0" style={{ height: `${HORIZON}%`, background: "linear-gradient(to bottom, var(--sky-1), var(--sky-2) 58%, var(--sky-3))" }} />

      {/* stars */}
      <div className="absolute inset-0" style={{ opacity: "var(--stars)" }}>
        {stars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animation: `twinkle ${s.d}s ${s.delay}s ease-in-out infinite` }}
          />
        ))}
      </div>

      {/* sun / moon with layered bloom */}
      <div className="absolute inset-0" style={par(6)}>
        <div
          className="absolute rounded-full"
          style={{
            left: "calc(var(--sun-x) * 1%)",
            top: "calc(var(--sun-y) * 1%)",
            width: "calc(var(--sun-size) * 9vmin)",
            height: "calc(var(--sun-size) * 6vmin)",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(closest-side, var(--sun-glow), transparent)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            left: "calc(var(--sun-x) * 1%)",
            top: "calc(var(--sun-y) * 1%)",
            width: "calc(var(--sun-size) * 1vmin)",
            height: "calc(var(--sun-size) * 1vmin)",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle at 50% 45%, white, var(--sun) 55%, color-mix(in oklab, var(--sun) 60%, var(--sun-glow)))",
            boxShadow: "0 0 calc(var(--sun-size) * 2vmin) calc(var(--sun-size) * 0.4vmin) var(--sun-glow)",
            animation: "breathe 9s ease-in-out infinite",
          }}
        />
      </div>

      {/* clouds: under-lit by the sun color */}
      <div className="absolute inset-x-0 top-0" style={{ height: `${HORIZON}%`, ...par(10) }}>
        {[
          { top: 14, w: 46, h: 5, dur: 210, delay: -40, o: 0.55 },
          { top: 26, w: 32, h: 3.5, dur: 160, delay: -120, o: 0.45 },
          { top: 38, w: 58, h: 4, dur: 260, delay: -10, o: 0.5 },
          { top: 47, w: 28, h: 2.4, dur: 140, delay: -70, o: 0.4 },
        ].map((c, i) => (
          <div
            key={i}
            className="absolute rounded-[50%]"
            style={{
              top: `${c.top}%`,
              left: 0,
              width: `${c.w}vw`,
              height: `${c.h}vh`,
              opacity: c.o,
              filter: "blur(14px)",
              background: "linear-gradient(to bottom, color-mix(in oklab, var(--sky-2) 55%, white), color-mix(in oklab, var(--sun-glow) 70%, var(--sky-3)))",
              animation: `drift ${c.dur}s linear ${c.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* far islands + cruise ship on the horizon (atmospheric perspective) */}
      <motion.svg
        className="absolute inset-x-0 w-full"
        style={{ top: `calc(${HORIZON}% - 9vh)`, height: "9.2vh", y: islandY }}
        viewBox="0 0 1600 100"
        preserveAspectRatio="none"
      >
        <path
          d="M0 100 L0 78 C80 70 140 52 220 58 C300 64 340 40 420 46 C470 50 520 72 600 80 L620 100 Z"
          style={{ fill: "color-mix(in oklab, var(--land) 45%, var(--sky-3))" }}
        />
        <path
          d="M1040 100 C1080 80 1120 30 1200 24 C1260 20 1300 50 1350 56 C1420 64 1480 44 1540 58 C1570 66 1590 80 1600 84 L1600 100 Z"
          style={{ fill: "color-mix(in oklab, var(--land) 60%, var(--sky-3))" }}
        />
        {/* ship silhouette */}
        <g style={{ fill: "color-mix(in oklab, var(--land) 70%, var(--sky-3))" }} transform="translate(760 80)">
          <path d="M0 18 L120 18 L112 26 L8 26 Z" />
          <rect x="16" y="10" width="86" height="8" rx="1" />
          <rect x="30" y="4" width="60" height="6" rx="1" />
          <rect x="64" y="-4" width="8" height="8" />
        </g>
      </motion.svg>

      {/* sea */}
      <div className="absolute inset-x-0 bottom-0" style={{ top: `${HORIZON}%`, background: "linear-gradient(to bottom, var(--sea-1), var(--sea-2) 75%)" }}>
        {/* horizon haze */}
        <div className="absolute inset-x-0 top-0 h-[7%]" style={{ background: "linear-gradient(to bottom, color-mix(in oklab, var(--sky-3) 70%, transparent), transparent)" }} />
        {/* glitter path beneath the sun */}
        <div className="absolute inset-0" style={{ left: "calc(var(--sun-x) * 1%)", opacity: "var(--glint-a)" }}>
          {glints.map((g, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                top: `${g.top}%`,
                left: `${g.off}vw`,
                width: `${g.w}vw`,
                height: `${g.h}vh`,
                transform: "translateX(-50%)",
                background: "linear-gradient(90deg, transparent, var(--glint), transparent)",
                opacity: g.a,
                filter: "blur(0.6px)",
                animation: `glint ${g.dur}s ${g.delay}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
        {/* wave lines */}
        {[18, 42, 70].map((top, i) => (
          <svg
            key={top}
            className="absolute left-0 h-[10%] w-[200%]"
            style={{ top: `${top}%`, animation: `waveSlide ${40 + i * 18}s linear infinite`, opacity: 0.18 + i * 0.07 }}
            viewBox="0 0 2400 40"
            preserveAspectRatio="none"
          >
            <path
              d={Array.from({ length: 24 }, (_, k) => `M${k * 100} 20 q25 -${6 + i * 3} 50 0 t50 0`).join(" ")}
              fill="none"
              strokeWidth={1 + i * 0.6}
              style={{ stroke: "color-mix(in oklab, var(--glint) 75%, transparent)" }}
            />
          </svg>
        ))}
      </div>

      {/* low mist */}
      <div className="absolute inset-x-0" style={{ top: `calc(${HORIZON}% - 6vh)`, height: "14vh", background: "linear-gradient(to bottom, transparent, var(--mist), transparent)", filter: "blur(10px)" }} />

      {/* foreground palms (rim-lit by the scene's light) */}
      <motion.div className="scene-fg absolute inset-0" style={{ y: palmY }}>
        <Palm className="palm-left absolute -left-[15vw] bottom-[-8vh] h-[78vh] opacity-95" sway={0} />
        <Palm className="palm-right absolute -right-[8vw] bottom-[-10vh] h-[64vh] -scale-x-100 opacity-95" sway={1.3} />
      </motion.div>

      {/* readability vignette */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, transparent 55%, color-mix(in oklab, var(--sea-2) 55%, transparent))" }} />
    </div>
  );
}

function Palm({ className, sway }: { className: string; sway: number }) {
  const fronds = [-150, -118, -88, -58, -28, 4, 34];
  return (
    <svg className={className} viewBox="0 0 320 460" style={{ overflow: "visible" }}>
      <path
        d="M58 470 C66 360 92 250 150 132 L160 137 C108 250 86 360 82 470 Z"
        style={{ fill: "var(--land)", stroke: "var(--land-rim)", strokeOpacity: 0.55, strokeWidth: 1.4 }}
      />
      {/* trunk rings */}
      {Array.from({ length: 12 }, (_, i) => {
        const t = i / 12;
        const y = 460 - t * 320;
        const x = 70 + t * t * 80 + t * 6;
        return <path key={i} d={`M${x - 10} ${y} q12 -5 24 0`} fill="none" style={{ stroke: "var(--land-rim)", strokeOpacity: 0.18 }} />;
      })}
      <g style={{ transformOrigin: "155px 134px", animation: `sway ${7 + sway}s ease-in-out ${sway}s infinite` }}>
        {fronds.map((a, i) => (
          <path
            key={i}
            transform={`translate(155 134) rotate(${a})`}
            d="M0 0 C45 -24 105 -22 160 18 C150 14 140 16 132 24 C124 16 112 16 104 24 C96 14 84 14 76 22 C66 12 52 10 42 16 C30 8 14 6 0 8 Z"
            style={{ fill: "var(--land)", stroke: "var(--land-rim)", strokeOpacity: 0.5, strokeWidth: 1.2 }}
          />
        ))}
        <circle cx="155" cy="136" r="9" style={{ fill: "var(--land)" }} />
      </g>
    </svg>
  );
}

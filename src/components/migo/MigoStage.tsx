"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { migo, type MigoEvent } from "./bus";
import { useCompanion } from "./CompanionProvider";
import { poseFor, POSES } from "./poses";
import { SpriteMigo } from "./SpriteMigo";
import { track } from "@/lib/client/track";

type Suggestion = Extract<MigoEvent, { type: "suggest" }>;

const PANEL_W = 420;

export function MigoStage() {
  const { state, prefs, setPrefs, reducedMotion, hide, show, openConcierge, closeConcierge } = useCompanion();
  const [vw, setVw] = useState(1280);
  const [vh, setVh] = useState(800);
  const [x, setX] = useState(24);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [frame, setFrame] = useState<0 | 1>(0);
  const [strolling, setStrolling] = useState(true);
  const [bubble, setBubble] = useState<Suggestion | null>(null);
  const seen = useRef(new Set<string>());
  const dir = useRef<1 | -1>(1);
  const xRef = useRef(24);

  const mobile = vw < 720;
  const size = mobile ? 84 : 124;

  useEffect(() => {
    const onR = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    onR();
    // Warm the cache for every pose so expression swaps never flash (~40KB each).
    Object.values(POSES).forEach((p) => {
      const img = new Image();
      img.src = p.src;
    });
    // Start over the open sea on the right, away from primary page actions.
    xRef.current = Math.max(16, Math.round(window.innerWidth * 0.62));
    setX(xRef.current);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  // On phones Migo is a compact corner launcher rather than a walker, so he never covers page controls.
  const roaming = state.mode === "roam" && !reducedMotion && !mobile;
  const expression = state.expression === "walking" && (!strolling || !roaming) ? "idle" : state.expression;
  const walking = expression === "walking";

  // Stroll / pause rhythm, with a little look-around during pauses.
  useEffect(() => {
    if (!roaming) return;
    let t: ReturnType<typeof setTimeout>;
    const cycle = (walk: boolean) => {
      setStrolling(walk);
      if (!walk && Math.random() < 0.6) setTimeout(() => setFacing((f) => (f === 1 ? -1 : 1)), 900);
      t = setTimeout(() => cycle(!walk), walk ? 6000 + Math.random() * 5000 : 2200 + Math.random() * 2000);
    };
    cycle(true);
    return () => clearTimeout(t);
  }, [roaming]);

  // When standing still on the lane, Migo turns to face the visitor's cursor.
  useEffect(() => {
    if (state.mode !== "roam" || walking || mobile || reducedMotion) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const centre = xRef.current + size / 2;
        if (Math.abs(e.clientX - centre) > 40) setFacing(e.clientX < centre ? -1 : 1);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [state.mode, walking, mobile, reducedMotion, size]);

  // Walk cycle frames.
  useEffect(() => {
    if (!walking) return;
    const t = setInterval(() => setFrame((f) => (f ? 0 : 1)), 240);
    return () => clearInterval(t);
  }, [walking]);

  // Movement along the safe shore lane.
  useEffect(() => {
    if (!walking) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      const max = Math.max(16, vw - size - 16);
      let nx = xRef.current + dir.current * 46 * dt;
      if (nx > max || nx < 16) {
        dir.current = dir.current === 1 ? -1 : 1;
        nx = Math.max(16, Math.min(max, nx));
      }
      xRef.current = nx;
      setX(nx);
      setFacing(dir.current);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [walking, vw, size]);

  // Suggestions + welcome. Before speaking, Migo moves somewhere his bubble won't cover
  // an important control (elements marked data-migo-avoid). No free spot → stay quiet.
  useEffect(
    () =>
      migo.on((e) => {
        if (e.type !== "suggest") return;
        if (!prefs.proactive || seen.current.has(e.key)) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const sz = w < 720 ? 84 : 124;
        const zones = [...document.querySelectorAll<HTMLElement>("[data-migo-avoid]")].map((el) => el.getBoundingClientRect());
        const blocked = (x: number) => {
          const box = { l: x, r: x + Math.max(sz, Math.min(316, w - 32)), t: h - sz - 190, b: h };
          return zones.some((z) => z.left < box.r && z.right > box.l && z.top < box.b && z.bottom > box.t);
        };
        const candidates = [xRef.current, 16, Math.round(w * 0.62), Math.round(w * 0.4), w - sz - 16].map((x) => Math.max(16, Math.min(w - sz - 16, x)));
        const spot = candidates.find((x) => !blocked(x));
        if (spot === undefined) return;
        seen.current.add(e.key);
        xRef.current = spot;
        setX(spot);
        setStrolling(false);
        setBubble(e);
      }),
    [prefs.proactive],
  );
  useEffect(() => {
    if (state.mode !== "roam") setBubble(null);
  }, [state.mode]);
  useEffect(() => {
    if (!bubble) return;
    const t = setTimeout(() => setBubble(null), 12000);
    return () => clearTimeout(t);
  }, [bubble]);

  // Where Migo stands for each mode.
  let targetX = mobile ? vw - size - 10 : reducedMotion ? 16 : x;
  let bottom = 10;
  let scale = 1;
  if (state.mode === "attend") {
    targetX = mobile ? vw - size - 12 : Math.max(16, vw - Math.min(PANEL_W, vw - 32) - size - 24);
    bottom = mobile ? Math.round(vh * 0.72) : 24;
  } else if (state.mode === "docked") {
    targetX = 12;
    scale = 0.68;
    bottom = 6;
  }
  const faceTo: 1 | -1 = state.mode === "attend" ? 1 : state.mode === "docked" ? 1 : facing;
  const pose = poseFor(expression, frame);

  if (state.mode === "hidden") {
    return (
      <button onClick={show} className="btn btn-ghost fixed bottom-4 left-4 z-40 !px-3 !py-2 text-xs" aria-label="Show Migo, the AI concierge">
        <img src={POSES.wave.src} alt="" width={22} height={22} /> Migo
      </button>
    );
  }

  return (
    <>

      <motion.div
        className="fixed z-40"
        style={{ left: 0 }}
        initial={false}
        animate={{ x: targetX, bottom, scale, opacity: state.mode === "docked" ? 0.85 : 1 }}
        transition={walking ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20, mass: 0.9 }}
      >
        <AnimatePresence>
          {bubble && state.mode === "roam" && (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              className="surface absolute bottom-full mb-3 w-[min(300px,calc(100vw-32px))] rounded-2xl p-4 text-sm"
              style={{ left: Math.min(0, vw - targetX - 316) }}
            >
              <p className="leading-relaxed text-ink">{bubble.text}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {(bubble.prompt || bubble.href) && (
                  <button
                    className="btn btn-primary !px-3 !py-1.5 text-xs"
                    onClick={() => {
                      track("recommendation.clicked", { page: bubble.key.slice(0, 40) });
                      if (bubble.href) {
                        document.querySelector(bubble.href)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
                      } else openConcierge(bubble.prompt);
                      setBubble(null);
                    }}
                  >
                    {bubble.cta ?? "Yes please"}
                  </button>
                )}
                <button className="btn btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setBubble(null)}>
                  Not now
                </button>
                <button
                  className="ml-auto text-[11px] text-ink-soft underline-offset-2 hover:underline"
                  onClick={() => {
                    setPrefs({ proactive: false });
                    track("proactive.disabled", {});
                    setBubble(null);
                  }}
                >
                  Turn off tips
                </button>
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-ink-soft">Migo is an AI assistant</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="group relative">
          <button
            type="button"
            onClick={() => {
              if (state.panelOpen) closeConcierge();
              else {
                migo.emit({ type: "user:poke" });
                openConcierge();
              }
            }}
            aria-label={state.panelOpen ? "Close Migo's concierge panel" : "Open Migo, your AI concierge"}
            aria-expanded={state.panelOpen}
            aria-controls="migo-concierge"
            className="block cursor-pointer rounded-full focus-visible:outline-offset-[-6px]"
            style={{ animation: !walking && !reducedMotion ? "bob 3.4s ease-in-out infinite" : undefined }}
          >
            <motion.div
              key={expression}
              initial={reducedMotion ? false : { scale: 0.94, y: 4 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 18 }}
            >
              <div className="origin-bottom transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:-rotate-2">
                <div
                  style={{
                    transform: walking ? `translateY(${frame ? -3 : 0}px) rotate(${frame ? 1.5 : -1.5}deg)` : undefined,
                    transformOrigin: "50% 100%",
                    animation: !walking && !reducedMotion ? "migoBreathe 3.8s ease-in-out infinite" : undefined,
                  }}
                >
                  <SpriteMigo pose={pose} size={size} facing={faceTo} reflection={state.mode !== "docked"} />
                </div>
              </div>
            </motion.div>
            {expression === "thinking" && (
              <span className="surface absolute -top-2 right-0 flex gap-1 rounded-full px-2.5 py-1.5" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-ink" style={{ animation: `twinkle 1s ${i * 0.18}s ease-in-out infinite` }} />
                ))}
              </span>
            )}
          </button>
          {state.mode === "roam" && (
            <button
              onClick={hide}
              className="absolute -right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/40 text-xs text-white backdrop-blur group-focus-within:flex group-hover:flex"
              aria-label="Hide Migo"
              title="Hide Migo"
            >
              ×
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}

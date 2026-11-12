"use client";

import { AnimatePresence, motion, useMotionValue, animate } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { migo, type MigoEvent } from "./bus";
import { useCompanion } from "./CompanionProvider";
import { poseFor, POSES } from "./poses";
import { SpriteMigo } from "./SpriteMigo";
import { usePathname } from "next/navigation";
import { ANTICIPATION_MS, STRIDE_MS, gaitAt, surfaceAt } from "./gait";
import { useTide } from "@/components/transition/TideTransition";
import { track } from "@/lib/client/track";

type Suggestion = Extract<MigoEvent, { type: "suggest" }>;

const PANEL_W = 420;
const compactViewport = (width: number, height: number) => width < 720 || (width < 1024 && height < 500);

export function MigoStage() {
  const {
    state,
    prefs,
    setPrefs,
    reducedMotion,
    hide,
    show,
    openConcierge,
    closeConcierge,
  } = useCompanion();
  const pathname = usePathname();
  const { go } = useTide();
  const stageX = useMotionValue(24);
  const [placed, setPlaced] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [contact, setContact] = useState(1);
  const [gaitPhase, setGaitPhase] = useState("still");
  const [vw, setVw] = useState(1280);
  const [vh, setVh] = useState(800);
  const [mobileBottom, setMobileBottom] = useState(10);
  const [x, setXState] = useState(24);
  const setX = useCallback(
    (value: number) => {
      if (window.innerWidth >= 720) stageX.set(value);
      setXState(value);
    },
    [stageX],
  );
  const [facing, setFacing] = useState<1 | -1>(1);
  const [frame, setFrame] = useState<0 | 1>(0);
  const [strolling, setStrolling] = useState(true);
  const [bubble, setBubble] = useState<Suggestion | null>(null);
  const seen = useRef(new Set<string>());
  const dir = useRef<1 | -1>(1);
  const xRef = useRef(24);
  // Drag-and-release (desktop, roaming only) and the hop between lane and chat.
  const [dragging, setDragging] = useState(false);
  const [hopping, setHopping] = useState(false);
  const dragRef = useRef<{
    startClient: number;
    startX: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const prevMode = useRef(state.mode);

  const mobile = compactViewport(vw, vh);
  const size = mobile ? 84 : 124;

  useLayoutEffect(() => {
    const width = window.innerWidth;
    const compact = compactViewport(width, window.innerHeight);
    const start = Math.max(16, width - (compact ? 84 : 124) - (compact ? 10 : 32));
    setVw(width);
    setVh(window.innerHeight);
    xRef.current = start;
    dir.current = -1;
    stageX.set(start);
    setXState(start);
    setPlaced(true);
  }, [stageX]);

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
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  // The compact phone launcher avoids marked controls and editorial text vertically. A fixed
  // corner alone can overlap a full-width form when it reaches the viewport edge.
  useEffect(() => {
    if (!mobile || state.mode !== "roam") return;
    let raf = 0;
    let settleUntil = performance.now() + 1200;
    const place = (now = performance.now()) => {
      const h = window.innerHeight;
      const left = window.innerWidth - size - 10;
      const zones = Array.from(
        document.querySelectorAll<HTMLElement>("[data-migo-avoid]"),
        (el) => el.getBoundingClientRect(),
      );
      let next = 10;
      for (let i = 0; i <= zones.length; i++) {
        const hit = zones.find(
          (z) =>
            z.left < left + size &&
            z.right > left &&
            z.top < h - next &&
            z.bottom > h - next - size,
        );
        if (!hit) break;
        next = h - hit.top + 12;
      }
      setMobileBottom(Math.max(10, Math.min(h - size - 90, next)));
      if (now < settleUntil) raf = requestAnimationFrame(place);
    };
    const schedule = () => {
      // ResizeObserver does not observe transforms. Follow short reveals after
      // scrolling/resizing, then stop sampling once the composition settles.
      settleUntil = performance.now() + 1200;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(place);
    };
    place();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [mobile, size, state.mode]);

  // A short, purposeful hop when moving between his lane and the chat panel.
  useEffect(() => {
    const was = prevMode.current;
    prevMode.current = state.mode;
    if (reducedMotion || mobile) return;
    const toChat = was === "roam" && state.mode === "attend";
    const back = was === "attend" && state.mode === "roam";
    if (!toChat && !back) return;
    setHopping(true);
    const t = setTimeout(() => {
      setHopping(false);
      if (!document.hidden)
        migo.emit({ type: "motion:landed", surface: surfaceAt(pathname) });
    }, 700);
    return () => {
      clearTimeout(t);
      setHopping(false);
    };
  }, [state.mode, reducedMotion, mobile, pathname]);

  /** Nearest lane position whose footprint doesn't cover a marked control (data-migo-avoid). */
  const safeSnap = useCallback((want: number) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const max = Math.max(16, w - size - 16);
    const zones = [
      ...document.querySelectorAll<HTMLElement>("[data-migo-avoid]"),
    ].map((el) => el.getBoundingClientRect());
    const blocked = (px: number) =>
      zones.some(
        (z) =>
          z.left < px + size &&
          z.right > px &&
          z.top < h &&
          z.bottom > h - size - 20,
      );
    const clamp = (px: number) => Math.max(16, Math.min(max, px));
    const start = clamp(want);
    if (!blocked(start)) return start;
    for (let d = 24; d < w; d += 24) {
      for (const px of [start - d, start + d])
        if (px >= 16 && px <= max && !blocked(px)) return px;
    }
    // A narrow free gutter may lie between the coarse samples and the exact edge.
    for (const edge of [max, 16]) if (!blocked(edge)) return edge;
    return start;
  }, [size]);

  // Recheck a standing companion when scrolling brings editorial content into its lane.
  useEffect(() => {
    if (!placed || mobile || state.mode !== "roam" || dragging || hopping) return;
    let raf = 0;
    const place = () => {
      const next = safeSnap(xRef.current);
      if (next === xRef.current) return;
      xRef.current = next;
      setX(next);
    };
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [placed, mobile, state.mode, dragging, hopping, safeSnap, setX]);
  const moveTo = (px: number) => {
    const nx = safeSnap(px);
    setFacing(nx < xRef.current ? -1 : 1);
    xRef.current = nx;
    setX(nx);
    setStrolling(false);
  };
  const canDrag = state.mode === "roam" && !mobile && !reducedMotion;

  // On phones Migo is a compact corner launcher rather than a walker, so he never covers page controls.
  const roaming =
    state.mode === "roam" && !reducedMotion && !mobile && !dragging;
  const expression =
    state.expression === "walking" && (!strolling || !roaming)
      ? "idle"
      : state.expression;
  const walking = expression === "walking";

  // Each burst finishes two actual strides. Recovery starts after completion,
  // rather than a competing timer cutting a contact short on a slower device.
  useEffect(() => {
    if (!roaming || strolling) return;
    const timer = setTimeout(() => setStrolling(true), 5000);
    return () => clearTimeout(timer);
  }, [roaming, strolling]);

  // When standing still on the lane, Migo turns to face the visitor's cursor.
  useEffect(() => {
    if (state.mode !== "roam" || walking || mobile || reducedMotion) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const centre = xRef.current + size / 2;
        if (Math.abs(e.clientX - centre) > 40)
          setFacing(e.clientX < centre ? -1 : 1);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [state.mode, walking, mobile, reducedMotion, size]);

  // One clock owns travel, pose, contact shadow and sound. The supplied poses
  // support short discrete steps, not a full articulated gait. Pause travel at
  // contact instead of continuously dragging the boots across the ground.
  useEffect(() => {
    if (!walking || reducedMotion || state.mode !== "roam") {
      setGaitPhase("still");
      setContact(1);
      return;
    }
    let raf = 0;
    let previous = performance.now();
    let elapsed = 0;
    const origin = xRef.current;
    const direction = dir.current;
    let previousContact = -1;
    const step = (now: number) => {
      if (document.hidden) {
        setStrolling(false);
        return;
      }
      elapsed += Math.min(48, now - previous);
      previous = now;
      if (elapsed >= ANTICIPATION_MS + STRIDE_MS * 2) {
        setStrolling(false);
        return;
      }
      const sample = gaitAt(elapsed, size);
      const max = Math.max(16, vw - size - 16);
      const want = origin + direction * sample.offset;
      const nx = Math.max(16, Math.min(max, want));
      // Check the actual footprint continuously: never cross a marked form/CTA.
      const h = window.innerHeight;
      const blocked = Array.from(
        document.querySelectorAll<HTMLElement>("[data-migo-avoid]"),
        (el) => el.getBoundingClientRect(),
      ).some(
        (z) =>
          z.left < nx + size &&
          z.right > nx &&
          z.top < h &&
          z.bottom > h - size - 20,
      );
      if (blocked || want !== nx) {
        dir.current = direction === 1 ? -1 : 1;
        setStrolling(false);
        return;
      }
      xRef.current = nx;
      stageX.set(nx);
      setFrame(sample.frame);
      setGaitPhase(sample.phase);
      setContact(sample.contact ? 1 : 0.55);
      if (stageRef.current)
        stageRef.current.dataset.travel = String(Math.round(nx * 100) / 100);
      if (sample.contact && sample.step !== previousContact) {
        previousContact = sample.step;
        const surface = surfaceAt(
          pathname,
          document.documentElement.dataset.migoSurface === "cabin",
        );
        window.dispatchEvent(
          new CustomEvent("sm:migo-contact", {
            detail: {
              foot: sample.frame ? "right" : "left",
              step: sample.step,
              surface,
              travel: nx,
            },
          }),
        );
        migo.emit({
          type: "motion:contact",
          source: "roam",
          foot: sample.frame ? "right" : "left",
          step: sample.step,
          surface,
        });
      }
      raf = requestAnimationFrame(step);
    };
    setFacing(direction);
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        setStrolling(false);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      setXState(xRef.current);
    };
  }, [walking, reducedMotion, state.mode, vw, size, pathname, stageX]);

  // Suggestions + welcome. Before speaking, Migo moves somewhere his bubble won't cover
  // an important control (elements marked data-migo-avoid). No free spot → stay quiet.
  useEffect(
    () =>
      migo.on((e) => {
        if (e.type !== "suggest") return;
        if (!prefs.proactive || seen.current.has(e.key)) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const sz = compactViewport(w, h) ? 84 : 124;
        const zones = [
          ...document.querySelectorAll<HTMLElement>("[data-migo-avoid], [data-migo-tip-avoid]"),
        ].map((el) => el.getBoundingClientRect());
        const blocked = (x: number) => {
          const box = {
            l: x,
            r: x + Math.max(sz, Math.min(316, w - 32)),
            t: h - sz - 190,
            b: h,
          };
          return zones.some(
            (z) =>
              z.left < box.r &&
              z.right > box.l &&
              z.top < box.b &&
              z.bottom > box.t,
          );
        };
        const candidates = [
          xRef.current,
          16,
          Math.round(w * 0.62),
          Math.round(w * 0.4),
          w - sz - 16,
        ].map((x) => Math.max(16, Math.min(w - sz - 16, x)));
        const spot = candidates.find((x) => !blocked(x));
        if (spot === undefined) return;
        seen.current.add(e.key);
        xRef.current = spot;
        setX(spot);
        setStrolling(false);
        setBubble(e);
      }),
    [prefs.proactive, setX],
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
  let bottom = mobile ? mobileBottom : 10;
  let scale = 1;
  if (state.mode === "attend") {
    targetX = mobile
      ? vw - size - 12
      : Math.max(16, vw - Math.min(PANEL_W, vw - 32) - size - 24);
    bottom = mobile ? Math.round(vh * 0.72) : 24;
  } else if (state.mode === "docked") {
    targetX = 12;
    scale = 0.68;
    bottom = 6;
  }
  if (dragging && state.mode === "roam") bottom = 26;
  const faceTo: 1 | -1 =
    state.mode === "attend" ? 1 : state.mode === "docked" ? 1 : facing;
  const pose = dragging || hopping ? "jump" : poseFor(expression, frame);

  useEffect(() => {
    if (!placed || walking || dragging) return;
    const controls = animate(stageX, targetX, {
      duration: reducedMotion || mobile ? 0 : hopping ? 0.7 : 0.35,
      ease: [0.25, 0.7, 0.3, 1],
    });
    return () => controls.stop();
  }, [targetX, walking, dragging, reducedMotion, hopping, stageX, placed, mobile]);

  if (state.mode === "hidden") {
    return (
      <button
        onClick={show}
        className="btn btn-ghost fixed bottom-4 left-4 z-40 !px-3 !py-2 text-xs"
        aria-label="Show Migo, the AI concierge"
      >
        <img src={POSES.wave.src} alt="" width={22} height={22} /> Migo
      </button>
    );
  }

  return (
    <>
      {!mobile && (
        <div
          className="companion-ground"
          data-surface={surfaceAt(pathname)}
          aria-hidden
        />
      )}
      <motion.div
        className="fixed z-40"
        ref={stageRef}
        data-migo-stage
        data-placement-ready={placed}
        data-mode={state.mode}
        data-expression={expression}
        data-gait={gaitPhase}
        data-frame={frame}
        data-hopping={hopping}
        style={{ left: 0, x: stageX, visibility: placed ? "visible" : "hidden" }}
        initial={false}
        animate={{
          bottom: hopping ? [10, 120, bottom] : bottom,
          scale,
          opacity: state.mode === "docked" ? 0.85 : 1,
        }}
        transition={
          reducedMotion || walking || dragging || (mobile && state.mode === "roam")
            ? { duration: 0 }
            : hopping
              ? {
                  duration: 0.7,
                  ease: [0.3, 0.7, 0.4, 1],
                  bottom: {
                    duration: 0.7,
                    times: [0, 0.45, 1],
                    ease: ["easeOut", "easeIn"],
                  },
                }
              : { type: "spring", stiffness: 120, damping: 20, mass: 0.9 }
        }
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
              style={{ left: Math.max(16, Math.min(targetX, vw - Math.min(300, vw - 32) - 16)) - targetX }}
            >
              <p className="leading-relaxed text-ink">{bubble.text}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {(bubble.prompt || bubble.href) && (
                  <button
                    className="btn btn-primary !px-3 !py-1.5 text-xs"
                    onClick={() => {
                      track("recommendation.clicked", {
                        page: bubble.key.slice(0, 40),
                      });
                      if (bubble.href) {
                        const [path, hash] = bubble.href.split("#");
                        if (hash && (!path || path === pathname))
                          document.getElementById(hash)?.scrollIntoView({
                            behavior: reducedMotion ? "auto" : "smooth",
                          });
                        else go(bubble.href);
                      } else openConcierge(bubble.prompt);
                      setBubble(null);
                    }}
                  >
                    {bubble.cta ?? "Yes please"}
                  </button>
                )}
                <button
                  className="btn btn-ghost !px-3 !py-1.5 text-xs"
                  onClick={() => setBubble(null)}
                >
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
              <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                Migo is an AI assistant
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="group relative">
          <button
            type="button"
            disabled={!placed}
            onClick={() => {
              if (suppressClick.current) {
                suppressClick.current = false;
                return;
              }
              if (state.panelOpen) closeConcierge();
              else {
                migo.emit({ type: "user:poke" });
                openConcierge();
              }
            }}
            onPointerDown={(e) => {
              if (!canDrag || e.button !== 0) return;
              dragRef.current = {
                startClient: e.clientX,
                startX: xRef.current,
                moved: false,
              };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const d = dragRef.current;
              if (!d) return;
              const dx = e.clientX - d.startClient;
              if (!d.moved && Math.abs(dx) < 6) return;
              if (!d.moved) {
                d.moved = true;
                setDragging(true);
                setBubble(null);
              }
              const nx = Math.max(
                16,
                Math.min(window.innerWidth - size - 16, d.startX + dx),
              );
              setFacing(dx < 0 ? -1 : 1);
              xRef.current = nx;
              setX(nx);
            }}
            onPointerUp={() => {
              const d = dragRef.current;
              dragRef.current = null;
              if (!d?.moved) return;
              suppressClick.current = true;
              setDragging(false);
              moveTo(xRef.current);
              track("migo.dragged", {});
            }}
            onPointerCancel={() => {
              dragRef.current = null;
              setDragging(false);
            }}
            onKeyDown={(e) => {
              if (!canDrag || (e.key !== "ArrowLeft" && e.key !== "ArrowRight"))
                return;
              e.preventDefault();
              moveTo(
                xRef.current +
                  (e.key === "ArrowLeft" ? -1 : 1) * (e.shiftKey ? 160 : 48),
              );
            }}
            title={
              canDrag
                ? "Click to chat · drag (or use arrow keys) to move Migo"
                : undefined
            }
            aria-keyshortcuts={canDrag ? "ArrowLeft ArrowRight" : undefined}
            aria-label={
              state.panelOpen
                ? "Close Migo's concierge panel"
                : "Open Migo, your AI concierge"
            }
            aria-expanded={state.panelOpen}
            aria-controls="migo-concierge"
            className={`block rounded-full focus-visible:outline-offset-[-6px] ${canDrag ? (dragging ? "cursor-grabbing touch-none" : "cursor-grab") : "cursor-pointer"}`}
          >
            <motion.div
              key={expression}
              initial={false}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 18 }}
            >
              <div className="origin-bottom">
                <div
                  style={{
                    transformOrigin: "50% 100%",
                    animation:
                      !walking && !reducedMotion
                        ? "migoBreathe 3.8s ease-in-out infinite"
                        : undefined,
                  }}
                >
                  <SpriteMigo
                    pose={pose}
                    size={size}
                    facing={faceTo}
                    reflection={false}
                    contact={contact}
                  />
                </div>
              </div>
            </motion.div>
            {expression === "thinking" && (
              <span
                className="surface absolute -top-2 right-0 flex gap-1 rounded-full px-2.5 py-1.5"
                aria-hidden
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-ink"
                    style={{
                      animation: `twinkle 1s ${i * 0.18}s ease-in-out infinite`,
                    }}
                  />
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

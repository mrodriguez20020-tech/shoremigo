"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SceneId } from "@/lib/domain/types";
import { migo } from "@/components/migo/bus";

/**
 * Scene lighting controller.
 *
 * A stack of scene "claims": the route claims a base scene, and sections in
 * view (e.g. the Golden Hour section) push temporary claims on top. The top
 * claim is written to <html data-scene>, and the registered CSS custom
 * properties in globals.css interpolate every color — sky, sea, UI surfaces
 * and Migo's lighting — so the whole world relights as one.
 */
interface SceneCtx {
  scene: SceneId;
  claim: (id: string, scene: SceneId, element?: HTMLElement) => void;
  release: (id: string) => void;
}

const Ctx = createContext<SceneCtx | null>(null);

export function SceneProvider({ children }: { children: ReactNode }) {
  const claims = useRef<
    { id: string; scene: SceneId; element?: HTMLElement }[]
  >([]);
  const [scene, setScene] = useState<SceneId>("day");

  const apply = useCallback(() => {
    const center = window.innerHeight / 2;
    const sections = claims.current
      .filter((c) => c.element?.isConnected)
      .map((c) => {
        const r = c.element!.getBoundingClientRect();
        const distance =
          center < r.top
            ? r.top - center
            : center > r.bottom
              ? center - r.bottom
              : 0;
        return { ...c, distance };
      })
      .sort((a, b) => a.distance - b.distance);
    const top =
      sections[0]?.scene ??
      claims.current.find((c) => c.id === "route")?.scene ??
      "day";
    setScene(top);
    document.documentElement.dataset.scene = top;
  }, []);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    migo.emit({ type: "scene:changed", scene });
  }, [scene]);

  const claim = useCallback(
    (id: string, s: SceneId, element?: HTMLElement) => {
      claims.current = claims.current.filter((c) => c.id !== id);
      claims.current.push({ id, scene: s, element });
      apply();
    },
    [apply],
  );

  const release = useCallback(
    (id: string) => {
      claims.current = claims.current.filter((c) => c.id !== id);
      apply();
    },
    [apply],
  );

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (claims.current.filter((c) => c.element).length < 2) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [apply]);

  return (
    <Ctx.Provider value={{ scene, claim, release }}>{children}</Ctx.Provider>
  );
}

export function useScene() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useScene outside SceneProvider");
  return c;
}

/** Route-level base scene. */
export function SceneRoute({ scene }: { scene: SceneId }) {
  const { claim, release } = useScene();
  useEffect(() => {
    const id = "route";
    claim(id, scene);
    return () => release(id);
  }, [scene, claim, release]);
  return null;
}

/** Claims a scene while the referenced element is the dominant thing on screen. */
export function useSceneWhileVisible(
  ref: React.RefObject<HTMLElement | null>,
  scene: SceneId,
  threshold = 0.45,
) {
  const { claim, release } = useScene();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const id = `section-${scene}-${Math.random().toString(36).slice(2, 7)}`;
    let io: IntersectionObserver;
    const observe = () => {
      io?.disconnect();
      // Pixels are intentional: IntersectionObserver resolves percentage root
      // margins against viewport width, which breaks short ultrawide displays.
      const inset = Math.round(
        window.innerHeight * Math.min(threshold / 2, 0.4),
      );
      io = new IntersectionObserver(
        ([entry]) =>
          entry.isIntersecting ? claim(id, scene, el) : release(id),
        { rootMargin: `-${inset}px 0px -${inset}px 0px`, threshold: 0 },
      );
      io.observe(el);
    };
    observe();
    window.addEventListener("resize", observe);
    return () => {
      io.disconnect();
      window.removeEventListener("resize", observe);
      release(id);
    };
  }, [ref, scene, threshold, claim, release]);
}

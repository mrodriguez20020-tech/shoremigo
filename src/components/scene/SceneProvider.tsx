"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
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
  claim: (id: string, scene: SceneId) => void;
  release: (id: string) => void;
}

const Ctx = createContext<SceneCtx | null>(null);

export function SceneProvider({ children }: { children: ReactNode }) {
  const claims = useRef<{ id: string; scene: SceneId }[]>([]);
  const [scene, setScene] = useState<SceneId>("day");

  const apply = useCallback(() => {
    const top = claims.current.at(-1)?.scene ?? "day";
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
    (id: string, s: SceneId) => {
      claims.current = claims.current.filter((c) => c.id !== id);
      claims.current.push({ id, scene: s });
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

  return <Ctx.Provider value={{ scene, claim, release }}>{children}</Ctx.Provider>;
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
export function useSceneWhileVisible(ref: React.RefObject<HTMLElement | null>, scene: SceneId, threshold = 0.45) {
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
      const inset = Math.round(window.innerHeight * Math.min(threshold / 2, 0.4));
      io = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? claim(id, scene) : release(id)),
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

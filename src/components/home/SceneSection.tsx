"use client";

import { useRef, type ReactNode } from "react";
import type { SceneId } from "@/lib/domain/types";
import { useSceneWhileVisible } from "@/components/scene/SceneProvider";

/** A section that relights the whole world (sky, sea, UI, Migo) while it's in view. */
export function SceneSection({ scene, children, className = "", id, threshold }: { scene: SceneId; children: ReactNode; className?: string; id?: string; threshold?: number }) {
  const ref = useRef<HTMLElement>(null);
  useSceneWhileVisible(ref, scene, threshold);
  return (
    <section ref={ref} id={id} className={className}>
      {children}
    </section>
  );
}

import type { MigoExpression } from "./machine";

/**
 * Pose library for the 2.5D sprite renderer. Sliced from the supplied sticker
 * sheet by scripts/slice-migo.mjs onto a 440×440 canvas with a shared baseline.
 * `compass` = compass centre in canvas px, used to place the compass glow.
 *
 * A future GLB renderer maps the same MigoExpression values to animation clips.
 */
export type PoseId = "wave" | "jump" | "walk-a" | "walk-b" | "think" | "concern" | "point" | "celebrate";

export const POSES: Record<PoseId, { src: string; compass: [number, number] }> = {
  wave: { src: "/migo/wave.webp", compass: [232, 316] },
  jump: { src: "/migo/jump.webp", compass: [224, 262] },
  "walk-a": { src: "/migo/walk-a.webp", compass: [252, 312] },
  "walk-b": { src: "/migo/walk-b.webp", compass: [246, 306] },
  think: { src: "/migo/think.webp", compass: [222, 322] },
  concern: { src: "/migo/concern.webp", compass: [230, 330] },
  point: { src: "/migo/point.webp", compass: [244, 326] },
  celebrate: { src: "/migo/celebrate.webp", compass: [265, 276] },
};

export const CANVAS = 440;

export function poseFor(expr: MigoExpression, walkFrame: 0 | 1): PoseId {
  switch (expr) {
    case "walking":
      return walkFrame ? "walk-b" : "walk-a";
    case "greeting":
      return "wave";
    case "curious":
    case "listening":
    case "thinking":
      return "think";
    case "suggesting":
    case "guiding":
    case "idle":
      return "point";
    case "excited":
      return "jump";
    case "celebrating":
      return "celebrate";
    case "concerned":
      return "concern";
  }
}

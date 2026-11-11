"use client";

import { CANVAS, POSES, type PoseId } from "./poses";

/**
 * 2.5D sprite renderer with scene-aware lighting.
 *
 * Honest description: this is image-space compositing on flat artwork, not
 * physically based 3D lighting. Each layer reads the scene's CSS custom
 * properties, so it relights in sync with the sky and sea:
 *
 *   1. grounding shadow  — color/opacity/skew from --migo-shadow*, --shadow-skew
 *   2. base sprite       — brightness/saturation from --migo-bright/--migo-sat
 *   3. ambient tint      — --migo-tint, soft-light blend, masked to his silhouette
 *   4. rim light         — edge band on the lit side: silhouette minus a copy of
 *                          itself shifted away from the light (--rim-angle)
 *   5. compass glow      — --compass/--compass-a, pulsing at the compass position
 *   6. water reflection  — faded, flipped copy; strength follows --glint-a
 */
export function SpriteMigo({ pose, size, facing = 1, reflection = true }: { pose: PoseId; size: number; facing?: 1 | -1; reflection?: boolean }) {
  const p = POSES[pose];
  const url = `url(${p.src})`;
  const [cx, cy] = p.compass;
  const mask: React.CSSProperties = {
    WebkitMaskImage: url,
    maskImage: url,
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
  };
  const shift = Math.max(2, Math.round(size / 55));

  return (
    <div className="relative select-none" style={{ width: size, height: size }} aria-hidden>
      {/* 1. grounding shadow */}
      <div
        className="absolute left-1/2 rounded-[50%]"
        style={{
          bottom: size * 0.0,
          width: size * 0.62,
          height: size * 0.09,
          transform: `translateX(-50%) skewX(calc(var(--shadow-skew) * 1deg)) scaleX(calc(1 + var(--shadow-skew) / 60))`,
          background: "radial-gradient(closest-side, var(--migo-shadow), transparent)",
          opacity: "var(--migo-shadow-a)",
          filter: "blur(3px)",
        }}
      />
      {/* 6. reflection (below the feet, behind the body) */}
      {reflection && (
        <div
          className="pointer-events-none absolute left-0"
          style={{
            top: size * 0.985,
            width: size,
            height: size * 0.45,
            overflow: "hidden",
            opacity: "calc(var(--glint-a) * 0.28)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent 80%)",
            maskImage: "linear-gradient(to bottom, black, transparent 80%)",
          }}
        >
          <img src={p.src} alt="" width={size} height={size} style={{ transform: `scale(${facing}, -1)`, filter: "blur(1.5px) brightness(var(--migo-bright))" }} />
        </div>
      )}
      <div className="absolute inset-0" style={{ transform: `scaleX(${facing})` }}>
        {/* 2. base sprite */}
        <img
          src={p.src}
          alt=""
          width={size}
          height={size}
          draggable={false}
          className="absolute inset-0 h-full w-full"
          style={{ filter: "brightness(var(--migo-bright)) saturate(var(--migo-sat))" }}
        />
        {/* 3. ambient tint */}
        <div className="absolute inset-0" style={{ ...mask, background: "var(--migo-tint)", opacity: "var(--migo-tint-a)", mixBlendMode: "soft-light" }} />
        <div
          className="absolute inset-0"
          style={{ ...mask, background: "linear-gradient(to top, var(--migo-shadow), transparent 45%)", opacity: "calc(var(--migo-shadow-a) * 0.6)", mixBlendMode: "multiply" }}
        />
        {/* 4. rim light — direction is mirrored with the sprite, so counter-mirror the angle */}
        <div
          className="absolute inset-0"
          style={{
            WebkitMaskImage: `${url}, ${url}`,
            maskImage: `${url}, ${url}`,
            WebkitMaskSize: "100% 100%, 100% 100%",
            maskSize: "100% 100%, 100% 100%",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: `0 0, calc(sin(var(--rim-angle)) * ${shift * facing}px) calc(cos(var(--rim-angle)) * ${-shift}px)`,
            maskPosition: `0 0, calc(sin(var(--rim-angle)) * ${shift * facing}px) calc(cos(var(--rim-angle)) * ${-shift}px)`,
            WebkitMaskComposite: "source-out",
            maskComposite: "subtract",
            background: "linear-gradient(var(--rim-angle), var(--migo-rim), color-mix(in oklab, var(--migo-rim) 40%, transparent) 55%, transparent)",
            opacity: "var(--migo-rim-a)",
            mixBlendMode: "screen",
            filter: "blur(0.4px)",
          }}
        />
        {/* 5. compass glow */}
        <div
          className="absolute rounded-full"
          style={{
            left: `${(cx / CANVAS) * 100}%`,
            top: `${(cy / CANVAS) * 100}%`,
            width: size * 0.3,
            height: size * 0.3,
            marginLeft: -size * 0.15,
            marginTop: -size * 0.15,
            background: "radial-gradient(closest-side, var(--compass), transparent)",
            mixBlendMode: "screen",
            animation: "compassPulse 3.2s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

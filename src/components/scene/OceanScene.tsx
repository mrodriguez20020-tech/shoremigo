"use client";

import Image from "next/image";

/** Shared fictional environment. Layered still media, not live 3D or a real destination. */
export function OceanScene({
  variant = "hero",
}: {
  variant?: "hero" | "welcome" | "intro" | "sunset";
}) {
  return (
    <div
      className={`ocean-scene ocean-${variant}`}
      aria-hidden
      data-ocean-scene={variant}
    >
      <div className="ocean-camera">
        <Image
          src="/cinematic/island-ocean.webp"
          alt=""
          fill
          priority={variant !== "sunset"}
          sizes="100vw"
          className={`ocean-plate ${variant === "sunset" ? "scene-photo" : ""}`}
        />
        <div className="ocean-water" />
        <div className="ocean-cloud-light" />
        <div className="ocean-vessel" data-aurora-tide>
          <svg className="ocean-wake" viewBox="0 0 700 280" fill="none">
            <defs>
              <linearGradient id={`wake-${variant}`}>
                <stop stopColor="#d9ffff" stopOpacity="0" />
                <stop offset="1" stopColor="#d9ffff" stopOpacity=".32" />
              </linearGradient>
            </defs>
            <path
              d="M20 250 Q185 220 350 155 L530 95 Q365 205 20 250Z"
              fill={`url(#wake-${variant})`}
            />
            <path
              d="M80 248 Q290 202 500 107 M130 237 Q330 191 515 102"
              stroke="#dcffff"
              strokeOpacity=".15"
              strokeWidth="2"
            />
          </svg>
          <Image
            src="/cinematic/aurora-tide.webp"
            alt=""
            width={1400}
            height={700}
            priority={variant !== "sunset"}
            sizes="(max-width: 639px) 90vw, 46vw"
            className="aurora-render"
          />
        </div>
      </div>
      <div className="ocean-golden-light" />
      <div className="ocean-depth" />
    </div>
  );
}

/** A transparent window onto the one shared backdrop. No ripple, ship-cutout or grading animation. */
export function OceanScene({ variant = "hero" }: { variant?: "hero" | "welcome" | "intro" | "sunset" }) {
  return <div className={`ocean-scene ocean-${variant}`} data-ocean-scene={variant} aria-hidden />;
}

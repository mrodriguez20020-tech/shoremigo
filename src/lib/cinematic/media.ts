export type FilmLight = "day" | "sunset";
export interface FilmVariant {
  width: number;
  height: number;
  frames: number;
  fps: 24 | 30;
  day: { mp4: string; webm?: string; poster: string };
  sunset: { mp4: string; webm?: string; poster: string };
}
export interface FilmLighting {
  tint: string;
  rim: string;
  shadow: string;
  compass: string;
  brightness: number;
  rimAngle: number;
  shadowSkew: number;
}
export interface FilmManifest {
  version: 1;
  status: "awaiting-production-media" | "ready";
  geometryId: string;
  cameraId: string;
  rights: string;
  lighting: Record<FilmLight, FilmLighting> | null;
  desktop: FilmVariant | null;
  mobile: FilmVariant | null;
}
const localAsset = (value: unknown, ext: string) =>
  typeof value === "string" &&
  new RegExp(`^/cinematic/film/[a-z0-9][a-z0-9_./-]*\\.${ext}$`).test(value) &&
  !value.includes("..");

/** Validates the delivery contract, not the artistic quality. Visual review remains required. */
export function parseFilmManifest(value: unknown): FilmManifest | null {
  if (!value || typeof value !== "object") return null;
  const m = value as FilmManifest;
  if (
    m.version !== 1 ||
    !["ready", "awaiting-production-media"].includes(m.status)
  )
    return null;
  if (m.status === "awaiting-production-media")
    return {
      version: 1,
      status: m.status,
      geometryId: "",
      cameraId: "",
      rights: "",
      lighting: null,
      desktop: null,
      mobile: null,
    };
  if (
    typeof m.geometryId !== "string" ||
    !m.geometryId ||
    typeof m.cameraId !== "string" ||
    !m.cameraId ||
    typeof m.rights !== "string" ||
    !m.rights ||
    !m.desktop
  )
    return null;
  for (const light of ["day", "sunset"] as const) {
    const l = m.lighting?.[light];
    if (
      !l ||
      ![l.tint, l.rim, l.shadow, l.compass].every((color) =>
        /^#[0-9a-f]{6}$/i.test(color),
      ) ||
      !Number.isFinite(l.brightness) ||
      l.brightness < 0.5 ||
      l.brightness > 1.3 ||
      !Number.isFinite(l.rimAngle) ||
      l.rimAngle < 0 ||
      l.rimAngle > 360 ||
      !Number.isFinite(l.shadowSkew) ||
      Math.abs(l.shadowSkew) > 60
    )
      return null;
  }
  for (const v of [m.desktop, m.mobile].filter((item): item is FilmVariant =>
    Boolean(item),
  )) {
    if (
      ![24, 30].includes(v.fps) ||
      !Number.isInteger(v.frames) ||
      v.frames / v.fps < 6 ||
      v.frames / v.fps > 16 ||
      !Number.isInteger(v.width) ||
      !Number.isInteger(v.height) ||
      v.width < 480 ||
      v.height < 480 ||
      v.width > 3840 ||
      v.height > 2160
    )
      return null;
    for (const light of ["day", "sunset"] as const) {
      if (
        !v[light] ||
        !localAsset(v[light].mp4, "mp4") ||
        !localAsset(v[light].poster, "webp") ||
        (v[light].webm && !localAsset(v[light].webm, "webm"))
      )
        return null;
    }
    if (v.day.mp4 === v.sunset.mp4 || v.day.poster === v.sunset.poster)
      return null;
  }
  return m;
}

export function loopDistance(a: number, b: number, duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) return Math.abs(a - b);
  const delta = Math.abs(a - b) % duration;
  return Math.min(delta, duration - delta);
}

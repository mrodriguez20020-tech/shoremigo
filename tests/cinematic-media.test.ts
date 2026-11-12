import { describe, expect, it } from "vitest";
import { loopDistance, parseFilmManifest } from "@/lib/cinematic/media";
const variant = {
  width: 1280,
  height: 720,
  fps: 24,
  frames: 192,
  day: { mp4: "/cinematic/film/day.mp4", poster: "/cinematic/film/day.webp" },
  sunset: {
    mp4: "/cinematic/film/sunset.mp4",
    poster: "/cinematic/film/sunset.webp",
  },
};
const ready = {
  version: 1,
  status: "ready",
  geometryId: "sha256-canonical-vessel",
  cameraId: "locked-main-camera",
  rights: "Original commissioned scene, commercial use authorized",
  lighting: {
    day: {
      tint: "#fff4d6",
      rim: "#ffffff",
      shadow: "#053049",
      compass: "#ffd27a",
      brightness: 1.04,
      rimAngle: 135,
      shadowSkew: -8,
    },
    sunset: {
      tint: "#ff9a5a",
      rim: "#ffb066",
      shadow: "#2a0d2e",
      compass: "#ffcf6e",
      brightness: 0.95,
      rimAngle: 135,
      shadowSkew: 22,
    },
  },
  desktop: variant,
  mobile: null,
};
describe("cinematic delivery contract", () => {
  it("keeps an unavailable production delivery explicitly unavailable", () => {
    expect(
      parseFilmManifest({ version: 1, status: "awaiting-production-media" })
        ?.desktop,
    ).toBeNull();
  });
  it("accepts a complete pair with canonical geometry, camera and rights metadata", () => {
    expect(parseFilmManifest(ready)?.status).toBe("ready");
  });
  it("does not accept a fabricated incomplete pair or one asset used for both lighting states", () => {
    expect(
      parseFilmManifest({ ...ready, desktop: { ...variant, sunset: null } }),
    ).toBeNull();
    expect(
      parseFilmManifest({
        ...ready,
        desktop: { ...variant, sunset: variant.day },
      }),
    ).toBeNull();
    expect(parseFilmManifest({ ...ready, geometryId: "" })).toBeNull();
    expect(parseFilmManifest({ ...ready, rights: "" })).toBeNull();
  });
  it("rejects path traversal, external services and wrong media types", () => {
    for (const mp4 of [
      "/cinematic/film/../private.mp4",
      "https://unapproved.example/clip.mp4",
      "/api/bookings",
      "/cinematic/film/audio.mp3",
    ]) {
      expect(
        parseFilmManifest({
          ...ready,
          desktop: { ...variant, day: { ...variant.day, mp4 } },
        }),
      ).toBeNull();
    }
  });
  it("rejects unsupported cadence, dimensions and clip duration", () => {
    for (const change of [
      { fps: 15 },
      { frames: 1 },
      { width: 0 },
      { height: 9000 },
    ])
      expect(
        parseFilmManifest({ ...ready, desktop: { ...variant, ...change } }),
      ).toBeNull();
  });
  it("measures alignment correctly across a loop seam", () => {
    expect(loopDistance(7.98, 0.02, 8)).toBeCloseTo(0.04);
    expect(loopDistance(3, 3.4, 8)).toBeCloseTo(0.4);
  });
});

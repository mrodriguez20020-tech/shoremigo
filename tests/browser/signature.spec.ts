import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

test.beforeAll(() => {
  fs.mkdirSync("work/signature/fixtures", { recursive: true });
  for (const light of ["day", "sunset"]) {
    const result = spawnSync("ffmpeg", [
      "-y", "-f", "lavfi", "-i", "testsrc2=size=640x480:rate=24:duration=6",
      "-vf", `hue=h=${light === "day" ? 0 : 60},drawtext=text='ENGINEERING FIXTURE - NOT CINEMATIC FOOTAGE':x=12:y=24:fontsize=16:fontcolor=white:box=1:boxcolor=black`,
      "-an", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", `work/signature/fixtures/${light}.mp4`,
    ], { encoding: "utf8" });
    if (result.status !== 0) throw new Error(`FFmpeg is required for native playback tests: ${result.stderr}`);
  }
});

const film = {
  version: 1,
  status: "ready",
  geometryId: "TEST-FIXTURE-NOT-PRODUCTION",
  cameraId: "TEST-CAMERA",
  rights: "Generated FFmpeg engineering pattern; never production footage",
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
  desktop: {
    width: 640,
    height: 480,
    frames: 144,
    fps: 24,
    day: { mp4: "/cinematic/film/day.mp4", poster: "/cinematic/film/day.webp" },
    sunset: {
      mp4: "/cinematic/film/sunset.mp4",
      poster: "/cinematic/film/sunset.webp",
    },
  },
  mobile: null,
};
async function enter(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem("sm.intro", "1");
    sessionStorage.setItem(
      "sm_prefs",
      JSON.stringify({
        lang: "en",
        country: null,
        remember: false,
        welcomed: true,
      }),
    );
    localStorage.setItem(
      "sm.migo.v1",
      JSON.stringify({
        prefs: { proactive: false, motionPaused: false },
        hidden: false,
      }),
    );
  });
}
async function useFixture(page: Page, broken = false) {
  await page.route("**/cinematic/film/manifest.json", (route) =>
    route.fulfill({ json: film }),
  );
  await page.route(/\/cinematic\/film\/(day|sunset)\.mp4$/, (route) => {
    const bytes = broken ? Buffer.from("not a video") : fs.readFileSync(
      `work/signature/fixtures/${route.request().url().includes("sunset") ? "sunset" : "day"}.mp4`,
    );
    // Native seeking requires real HTTP byte-range semantics, as Next's public-file server provides.
    const range = /bytes=(\d+)-(\d*)/.exec(route.request().headers().range || "");
    const start = range ? Number(range[1]) : 0;
    const end = range?.[2] ? Math.min(Number(range[2]), bytes.length - 1) : bytes.length - 1;
    const body = bytes.subarray(start, end + 1);
    return route.fulfill({
      status: range ? 206 : 200,
      contentType: "video/mp4",
      headers: {
        "accept-ranges": "bytes", "content-length": String(body.length),
        ...(range ? { "content-range": `bytes ${start}-${end}/${bytes.length}` } : {}),
      },
      body,
    });
  });
  await page.route(/\/cinematic\/film\/(day|sunset)\.webp$/, (route) =>
    route.fulfill({
      contentType: "image/webp",
      body: fs.readFileSync("public/cinematic/signature-still.webp"),
    }),
  );
}

test("missing production media is an honest still, with no fake ripple, cutout or orange overlay", async ({
  page,
}) => {
  await enter(page);
  await page.goto("/");
  await expect(page.locator("[data-cinematic-backdrop]")).toHaveAttribute(
    "data-media-state",
    "poster-only",
  );
  await expect(
    page.locator(".ocean-water,.ocean-vessel,.ocean-golden-light"),
  ).toHaveCount(0);
  expect(await page.locator("video[src]").count()).toBe(0);
  await page.locator("#golden-hour").scrollIntoViewIfNeeded();
  await expect(page.locator("[data-cinematic-backdrop]")).toHaveAttribute(
    "data-cinematic-scene",
    "sunset",
  );
  await expect(page.locator(".cinematic-poster")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.style.getPropertyValue("--migo-tint"))).toBe("#fff4d6");
});

test("one native film pair plays silently and swaps matched phases on scene changes", async ({
  page,
}) => {
  await enter(page);
  await useFixture(page);
  await page.goto("/");
  const backdrop = page.locator("[data-cinematic-backdrop]");
  await expect(backdrop).toHaveAttribute("data-media-state", "playing");
  expect(await page.locator("video").count()).toBe(2);
  expect(
    await page
      .locator('video[data-light="day"]')
      .evaluate(
        (v: HTMLVideoElement) => v.muted && v.volume === 0 && !v.paused,
      ),
  ).toBe(true);
  await page.evaluate(() => {
    const backdrop = document.querySelector("[data-cinematic-backdrop]")!;
    const observer = new MutationObserver(() => {
      if (backdrop.getAttribute("data-media-state") !== "transitioning" || backdrop.getAttribute("data-light") !== "sunset") return;
      const videos = Array.from(document.querySelectorAll("video"));
      const delta = Math.abs(videos[0].currentTime - videos[1].currentTime) % 6;
      (window as unknown as { filmHandoff: number }).filmHandoff = Math.min(delta, 6 - delta);
      observer.disconnect();
    });
    observer.observe(backdrop, { attributes: true });
  });
  await page.locator("#golden-hour").scrollIntoViewIfNeeded();
  await expect(backdrop).toHaveAttribute("data-light", "sunset");
  await expect(backdrop).toHaveAttribute("data-media-state", "playing");
  const aligned = await page.locator("video").evaluateAll((videos) => {
    const [day, sunset] = videos as HTMLVideoElement[];
    return {
      dayPaused: day.paused,
      sunsetPlaying: !sunset.paused,
      muted: videos.every(
        (v) =>
          (v as HTMLVideoElement).muted && (v as HTMLVideoElement).volume === 0,
      ),
    };
  });
  // Measure phase at the handoff, not after the outgoing film has paused and the incoming film advances.
  expect(await page.evaluate(() => (window as unknown as { filmHandoff: number }).filmHandoff)).toBeLessThan(0.2);
  await expect(page.locator("video").first()).toHaveCSS("transition-duration", "0.75s");
  expect(aligned.dayPaused).toBe(true);
  expect(aligned.sunsetPlaying).toBe(true);
  expect(aligned.muted).toBe(true);
  await page.locator("#ports").scrollIntoViewIfNeeded();
  await expect
    .poll(async () =>
      page
        .locator("video")
        .evaluateAll((videos) =>
          videos.every((v) => (v as HTMLVideoElement).paused),
        ),
    )
    .toBe(true);
});

test("reduced motion never requests video bytes and keeps controls usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enter(page);
  await useFixture(page);
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith(".mp4")) requests.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator("[data-cinematic-backdrop]")).toHaveAttribute(
    "data-media-state",
    "reduced-motion",
  );
  expect(requests).toHaveLength(0);
  await page
    .getByRole("button", { name: "Explore tours", exact: true })
    .click();
  await expect(page).toHaveURL(/excursions/);
});

test("a broken film fails to the still without blocking navigation", async ({
  page,
}) => {
  await enter(page);
  await useFixture(page, true);
  await page.route(/\/cinematic\/film\/(day|sunset)\.webp$/, (route) => route.fulfill({ status: 404, body: "Missing poster" }));
  await page.goto("/");
  await expect(page.locator("[data-cinematic-backdrop]")).toHaveAttribute(
    "data-media-state",
    "media-error",
  );
  await expect(page.locator(".cinematic-poster")).toBeVisible();
  await expect(page.locator(".cinematic-poster")).toHaveAttribute("src", /\/cinematic\/signature-still\.webp$/);
  await page
    .getByRole("button", { name: "Explore tours", exact: true })
    .click();
  await expect(page).toHaveURL(/excursions/);
});

test("rapid reversals cannot leave an obsolete lighting target or an audible film", async ({
  page,
}) => {
  await enter(page);
  await useFixture(page);
  await page.goto("/");
  await expect(page.locator("[data-cinematic-backdrop]")).toHaveAttribute(
    "data-media-state",
    "playing",
  );
  for (const id of [
    "golden-hour",
    "ports",
    "golden-hour",
    "ports",
    "golden-hour",
  ]) {
    await page.locator(`#${id}`).evaluate((el) =>
      window.scrollTo({
        top:
          scrollY +
          el.getBoundingClientRect().top +
          el.clientHeight / 2 -
          innerHeight / 2,
        behavior: "instant",
      }),
    );
    await page.waitForTimeout(60);
  }
  await expect(page.locator("[data-cinematic-backdrop]")).toHaveAttribute(
    "data-light",
    "sunset",
  );
  await expect(page.locator("[data-cinematic-backdrop]")).toHaveAttribute(
    "data-media-state",
    "playing",
  );
  expect(
    await page
      .locator("video")
      .evaluateAll((videos) =>
        videos.every((v) => (v as HTMLVideoElement).muted),
      ),
  ).toBe(true);
});

test("Save-Data avoids movie transfer entirely", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } });
  });
  await enter(page);
  await useFixture(page);
  const movies: string[] = [];
  page.on("request", (request) => { if (request.url().endsWith(".mp4")) movies.push(request.url()); });
  await page.goto("/");
  await expect(page.locator("[data-cinematic-backdrop]")).toHaveAttribute("data-media-state", "save-data");
  expect(movies).toHaveLength(0);
  await expect(page.locator(".cinematic-poster")).toBeVisible();
});

test("autoplay refusal leaves a usable poster instead of a blocked entrance", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("Browser policy", "NotAllowedError"));
  });
  await enter(page);
  await useFixture(page);
  await page.goto("/");
  await expect(page.locator("[data-cinematic-backdrop]")).toHaveAttribute("data-media-state", "autoplay-blocked");
  await expect(page.locator(".cinematic-poster")).toBeVisible();
  await page.getByRole("button", { name: "Explore tours", exact: true }).click();
  await expect(page).toHaveURL(/excursions/);
});

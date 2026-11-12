/** Actual public-manifest interim review. No test footage, synthetic scene motion or external audio. */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const base = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3002";
const dir = "docs/signature/evidence";
await mkdir(dir, { recursive: true });
await mkdir("work/signature/video", { recursive: true });
const browser = await chromium.launch({
  headless: process.env.PLAYWRIGHT_HEADED !== "1",
  ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}),
  args: ["--no-sandbox"],
});
const errors = [];
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  recordVideo: { dir: "work/signature/video", size: { width: 1280, height: 888 } },
});
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(error.message));
const started = Date.now();
await page.goto(base);
await page.getByRole("dialog", { name: "Welcome to ShoreMigo" }).waitFor();
await page.waitForTimeout(1800);
await page.screenshot({ path: `${dir}/welcome-desktop.png` });
await page.getByRole("dialog").getByRole("button", { name: "Begin exploring", exact: true }).click();
await page.waitForTimeout(1400);
const notNow = page.getByRole("button", { name: "Not now", exact: true });
if (await notNow.isVisible()) {
  await notNow.click();
  await notNow.waitFor({ state: "hidden" });
}
await page.screenshot({ path: `${dir}/home-desktop.png` });
await page.waitForTimeout(2200);
await page.getByRole("button", { name: "Ask Migo", exact: true }).click();
await page.waitForTimeout(1800);
await page.getByRole("button", { name: "Close concierge", exact: true }).click();
await page.waitForTimeout(1200);
for (const id of ["discover", "ports", "golden-hour"]) {
  await page.locator(`#${id}`).evaluate((el) => window.scrollTo({
    top: scrollY + el.getBoundingClientRect().top + (el.id === "golden-hour" ? el.clientHeight / 2 - innerHeight / 2 : -90),
    behavior: "smooth",
  }));
  await page.waitForTimeout(id === "golden-hour" ? 3500 : 1600);
}
await page.screenshot({ path: `${dir}/golden-hour-desktop.png` });
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
await page.waitForTimeout(Math.max(1800, 28000 - (Date.now() - started)));
const video = page.video();
await context.close();
const result = spawnSync("ffmpeg", [
  "-y", "-i", await video.path(), "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "25", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${dir}/interim-browser-review.mp4`,
], { encoding: "utf8" });
if (result.status !== 0) throw new Error(result.stderr.slice(-1500));
const measurements = [];
for (const [name, width, height] of [["desktop", 1440, 1000], ["tablet", 820, 1180], ["mobile", 390, 844], ["narrow", 320, 700]]) {
  const p = await browser.newPage({ viewport: { width, height } });
  p.on("pageerror", (error) => errors.push(error.message));
  await p.addInitScript(() => {
    window.__shifts = 0;
    new PerformanceObserver((list) => list.getEntries().forEach((entry) => {
      if (!entry.hadRecentInput) window.__shifts += entry.value;
    })).observe({ type: "layout-shift", buffered: true });
  });
  await p.goto(base);
  await p.getByRole("dialog", { name: "Welcome to ShoreMigo" }).waitFor();
  await p.waitForTimeout(1400);
  if (name !== "desktop") await p.screenshot({ path: `${dir}/welcome-${name}.png` });
  if (name === "narrow") {
    await p.getByRole("dialog").getByRole("button", { name: "Begin exploring", exact: true }).scrollIntoViewIfNeeded();
    await p.screenshot({ path: `${dir}/preferences-narrow.png` });
  }
  await p.getByRole("dialog").getByRole("button", { name: "Skip", exact: true }).click();
  await p.waitForTimeout(1400);
  const skip = p.getByRole("button", { name: "Not now", exact: true });
  if (await skip.isVisible()) {
    await skip.click();
    await skip.waitFor({ state: "hidden" });
  }
  await p.waitForTimeout(600);
  if (name !== "desktop") await p.screenshot({ path: `${dir}/home-${name}.png` });
  const data = await p.evaluate(async () => {
    const times = [], tasks = [];
    const observer = new PerformanceObserver((list) => list.getEntries().forEach((entry) => tasks.push(entry.duration)));
    observer.observe({ type: "longtask" });
    let previous = performance.now();
    const start = previous;
    await new Promise((resolve) => {
      const frame = (now) => {
        times.push(now - previous); previous = now;
        if (now - start < 2500) requestAnimationFrame(frame); else resolve();
      };
      requestAnimationFrame(frame);
    });
    observer.disconnect();
    times.shift(); times.sort((a, b) => a - b);
    const resources = performance.getEntriesByType("resource");
    return {
      frames: times.length,
      meanIntervalMs: times.reduce((a,b) => a+b, 0) / times.length,
      p95IntervalMs: times[Math.floor(times.length * .95)],
      longTasks: tasks.length, maxLongTaskMs: Math.max(0, ...tasks), cls: window.__shifts,
      overflow: document.documentElement.scrollWidth > innerWidth,
      mediaState: document.querySelector("[data-cinematic-backdrop]")?.getAttribute("data-media-state"),
      filmRequests: resources.filter((r) => /\.(mp4|webm)(\?|$)/.test(r.name)).length,
      posterResources: resources.filter((r) => r.name.includes("signature-still")).map((r) => ({ durationMs: r.duration, transferBytes: r.transferSize, decodedBytes: r.decodedBodySize })),
    };
  });
  measurements.push({ viewport: name, width, height, ...data });
  await p.locator("#golden-hour").scrollIntoViewIfNeeded();
  await p.waitForTimeout(1000);
  if (name !== "desktop") await p.screenshot({ path: `${dir}/golden-hour-${name}.png` });
  await p.close();
}
await writeFile(`${dir}/performance.json`, JSON.stringify({
  status: "Interim still only. Moving-water and sunset-film acceptance BLOCKED.",
  environment: "Headed system Chromium on virtual Xorg software display in managed Linux, three CPU cores, no GPU. Viewport emulation, not physical mobile. Short 2.5-second RAF samples without recording overhead; not sustained GPU/frame-decode benchmarks.",
  method: "RAF/long-task samples last 2.5 seconds. cls is the raw sum of observed non-recent-input shifts from navigation through the sample, not a full-session Core Web Vitals score. Poster loading is localhost/cached transport, not a mobile-network benchmark. No production video decode was measured.",
  audio: "Muted recording; app audio was not enabled.",
  measurements, browserErrors: errors,
}, null, 2) + "\n");
await browser.close();
console.log(JSON.stringify({ recording: `${dir}/interim-browser-review.mp4`, measurements, browserErrors: errors }, null, 2));

/** Actual public-manifest interim review. No test footage, synthetic scene motion or external audio. */
import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
const base = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3002";
const dir = process.env.EVIDENCE_DIR || "work/evidence/wp01-review";
const evidenceRoot = path.resolve("work/evidence") + path.sep;
if (!path.resolve(dir).startsWith(evidenceRoot)) throw new Error("Write review captures under ignored work/evidence; publish assets separately.");
const screenshot = (page, name) => page.screenshot({ path: `${dir}/${name}.jpg`, type: "jpeg", quality: 86 });
const masks = [];
async function captureMask(page, viewport, state) {
  const mask = await page.evaluate(() => {
    const selectors = ["header", ".welcome-story", ".welcome-card", ".welcome-companion", ".luxury-hero [data-migo-avoid]", ".hero-vessel-caption", ".golden-scene [data-migo-avoid]", "[data-migo-stage]", '[role="status"]'];
    const boxes = selectors.flatMap(selector => [...document.querySelectorAll(selector)].map(element => {
      const r = element.getBoundingClientRect(), style = getComputedStyle(element);
      return { selector, left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height,
        visible:style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0 && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight };
    })).filter(box => box.visible);
    return { width:innerWidth, height:innerHeight, objectPosition:getComputedStyle(document.querySelector(".cinematic-poster")).objectPosition, boxes };
  });
  masks.push({ viewport, state, ...mask });
  const rects = mask.boxes.map(box => `<rect x="${box.left}" y="${box.top}" width="${box.width}" height="${box.height}" fill="${box.selector.includes("subject") ? "#17c4ba" : "#e4b55b"}" fill-opacity=".15" stroke="#e4b55b"/>`).join("");
  await writeFile(`${dir}/mask-${viewport}-${state}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="${mask.width}" height="${mask.height}" viewBox="0 0 ${mask.width} ${mask.height}"><rect width="100%" height="100%" fill="#071d26"/>${rects}<text x="12" y="20" fill="white" font-size="12">UI mask · ${viewport} · ${state} · interim assets only</text></svg>`);
}
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
await page.locator('[data-greeting-phase="wave"]').waitFor();
await screenshot(page, `welcome-desktop`);
await page.getByRole("dialog").getByRole("button", { name: "Begin exploring", exact: true }).click();
await page.locator('[data-migo-stage][data-mode="roam"][data-placement-ready="true"]').waitFor();
const notNow = page.getByRole("button", { name: "Not now", exact: true });
if (await notNow.isVisible()) {
  await notNow.click();
  await notNow.waitFor({ state: "hidden" });
}
await screenshot(page, `home-desktop`);
await page.waitForTimeout(2200);
await page.getByRole("button", { name: "Ask Migo", exact: true }).click();
await page.waitForTimeout(1800);
await page.getByRole("button", { name: "Close concierge", exact: true }).click();
await page.waitForTimeout(1200);
for (const id of ["discover", "ports", "golden-hour"]) {
  await page.locator(`#${id}`).evaluate((el) => window.scrollTo({
    top: scrollY + el.getBoundingClientRect().top + (el.id === "golden-hour" ? 0 : -90),
    behavior: "smooth",
  }));
  await page.waitForTimeout(id === "golden-hour" ? 3500 : 1600);
}
await screenshot(page, `golden-hour-desktop`);
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
await page.waitForTimeout(Math.max(1800, 28000 - (Date.now() - started)));
const video = page.video();
await context.close();
const result = spawnSync("ffmpeg", [
  "-y", "-i", await video.path(), "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "25", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${dir}/interim-browser-review.mp4`,
], { encoding: "utf8" });
if (result.status !== 0) throw new Error(result.stderr.slice(-1500));
const measurements = [];
const composition = [];
for (const [name, width, height] of [["desktop", 1440, 1000], ["tablet", 820, 1180], ["mobile", 390, 844], ["narrow", 320, 700], ["desktop-short", 1024, 768], ["phone-landscape", 844, 390]]) {
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
  await p.locator('[data-greeting-phase="wave"]').waitFor();
  if (name !== "desktop") await screenshot(p, `welcome-${name}`);
  await captureMask(p, name, "welcome");
  if (name === "narrow") {
    await p.getByRole("dialog").getByRole("button", { name: "Begin exploring", exact: true }).scrollIntoViewIfNeeded();
    await screenshot(p, `preferences-narrow`);
  }
  await p.getByRole("dialog").getByRole("button", { name: "Skip", exact: true }).click();
  await p.locator('[data-migo-stage][data-mode="roam"][data-placement-ready="true"]').waitFor();
  const skip = p.getByRole("button", { name: "Not now", exact: true });
  if (await skip.isVisible()) {
    await skip.click();
    await skip.waitFor({ state: "hidden" });
  }
  await p.locator(".hero-actions").locator("..").waitFor();
  if (name !== "desktop") await screenshot(p, `home-${name}`);
  await captureMask(p, name, "hero");
  if (name !== "desktop") {
    const tagline = p.locator(".luxury-hero").getByText("Your adventure doesn't stop when plans change.", { exact: true });
    await tagline.evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().bottom - innerHeight + 45, behavior: "instant" }));
    await expect.poll(() => p.evaluate(() => {
      const a = document.querySelector("[data-migo-stage]").getBoundingClientRect();
      return [...document.querySelectorAll(".luxury-hero [data-migo-avoid]")].every(el => {
        const b = el.getBoundingClientRect();
        return a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom;
      });
    })).toBe(true);
    await screenshot(p, `hero-launcher-${name}`);
    await p.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  }
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
  await p.locator(".golden-window").evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top, behavior: "instant" }));
  await p.waitForTimeout(1000);
  if (name !== "desktop") await screenshot(p, `golden-hour-${name}`);
  await captureMask(p, name, "golden");
  composition.push({ viewport: name, width, height, ...await p.evaluate(() => {
    const rect = selector => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height };
    };
    return { window:rect(".golden-window"), protectedSubject:rect("[data-cinematic-subject-safe]"), editorialCopy:rect(".golden-copy"), excursion:rect(".golden-excursion") };
  }) });
  await p.locator(".golden-copy").scrollIntoViewIfNeeded();
  await expect(p.locator(".golden-copy").locator("..")).toHaveCSS("opacity", "1");
  await p.locator(".golden-excursion").scrollIntoViewIfNeeded();
  await screenshot(p, `golden-editorial-${name}`);
  await p.close();
}
await writeFile(`${dir}/composition.json`, JSON.stringify({ note: "Actual UI rectangles for production crop/safe-area review, not a vessel geometry approval. Golden coordinates are viewport pixels with the cinematic window aligned to the top. Masks use the interim EN interface; final film contact sheets in both lights/all languages remain required.", viewports: composition, masks }, null, 2) + "\n");
await writeFile(`${dir}/performance.json`, JSON.stringify({
  status: "Interim still only. Moving-water and sunset-film acceptance BLOCKED.",
  environment: "Headed system Chromium on virtual Xorg software display in managed Linux, three CPU cores, no GPU. Viewport emulation, not physical mobile. Short 2.5-second RAF samples without recording overhead; not sustained GPU/frame-decode benchmarks.",
  method: "RAF/long-task samples last 2.5 seconds. cls is the raw sum of observed non-recent-input shifts from navigation through the sample, not a full-session Core Web Vitals score. Poster loading is localhost/cached transport, not a mobile-network benchmark. No production video decode was measured.",
  audio: "Muted recording; app audio was not enabled.",
  measurements, browserErrors: errors,
}, null, 2) + "\n");
await browser.close();
console.log(JSON.stringify({ recording: `${dir}/interim-browser-review.mp4`, measurements, browserErrors: errors }, null, 2));

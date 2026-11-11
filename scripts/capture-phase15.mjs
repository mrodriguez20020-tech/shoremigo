/** Production-browser evidence, not an animation mock. Requires Playwright Chromium, its FFmpeg, and ffmpeg CLI. */
import { chromium } from "@playwright/test";
import { mkdir, writeFile, copyFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const base = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3001";
const dir = "docs/phase15";
await mkdir(dir, { recursive: true });
await mkdir("work/phase15/video", { recursive: true });
const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
    : {}),
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  recordVideo: {
    dir: "work/phase15/video",
    size: { width: 1280, height: 888 },
  },
});
await context.addInitScript(() => {
  // Tap only the app's own Web Audio output. No microphone or external audio.
  const original = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (destination, ...rest) {
    const result = original.call(this, destination, ...rest);
    if (destination instanceof AudioDestinationNode) {
      const output = this.context.createMediaStreamDestination();
      original.call(this, output);
      const recorder = new MediaRecorder(output.stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      const chunks = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      window.__recordedAudio = { recorder, chunks, start: Date.now() };
      recorder.start(200);
    }
    return result;
  };
});
const page = await context.newPage();
const videoEpoch = Date.now();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(base);
await page.getByRole("dialog", { name: "Welcome to ShoreMigo" }).waitFor();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${dir}/welcome-desktop.png` });
await page
  .getByRole("dialog")
  .getByRole("button", { name: "Continue", exact: true })
  .click();
await page.waitForTimeout(1200);
await page.getByRole("button", { name: "Not now", exact: true }).click();
const settings = page.getByRole("button", {
  name: /Sound and experience settings/,
});
await settings.click();
await page.getByText("Enable sound", { exact: true }).click();
await page.getByText("Ocean ambience", { exact: true }).click();
await page.getByText("Helpful tips from Migo", { exact: true }).click();
await settings.click();
await page.screenshot({ path: `${dir}/home-desktop.png` });
// Observe real contact events: polling can miss their deliberately brief windows.
async function waitForContact(foot) {
  await page.evaluate((requestedFoot) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => { window.removeEventListener("sm:migo-contact", onContact); reject(new Error("No rendered contact within 20s")); }, 20000);
    function onContact(event) {
      if (event.detail.foot !== requestedFoot) return;
      clearTimeout(timer); window.removeEventListener("sm:migo-contact", onContact);
      requestAnimationFrame(() => resolve());
    }
    window.addEventListener("sm:migo-contact", onContact);
  }), foot);
}
await waitForContact("left");
await page.screenshot({ path: `${dir}/walking-left.png` });
await waitForContact("right");
await page.screenshot({ path: `${dir}/walking-right.png` });
await page.waitForTimeout(800);
await page.getByRole("button", { name: "Ask Migo", exact: true }).click();
await page.waitForTimeout(850);
await page
  .getByRole("button", { name: "Close concierge", exact: true })
  .click();
await page.waitForTimeout(850);
for (const selector of ["#discover", "#ports", "#golden-hour"]) {
  await page
    .locator(selector)
    .evaluate((el) =>
      window.scrollTo({
        top:
          window.scrollY +
          el.getBoundingClientRect().top +
          (el.id === "golden-hour"
            ? el.clientHeight / 2 - innerHeight / 2
            : -90),
        behavior: "smooth",
      }),
    );
  await page.waitForTimeout(selector === "#golden-hour" ? 1900 : 1100);
}
await page.screenshot({ path: `${dir}/golden-hour-desktop.png` });
await page.waitForTimeout(1000);
const audio = await page.evaluate(async () => {
  const item = window.__recordedAudio;
  if (!item) return null;
  await new Promise((resolve) => {
    item.recorder.onstop = resolve;
    item.recorder.stop();
  });
  return {
    start: item.start,
    bytes: Array.from(
      new Uint8Array(await new Blob(item.chunks).arrayBuffer()),
    ),
  };
});
const video = page.video();
await context.close();
const rawVideo = await video.path();
if (audio) {
  await writeFile("work/phase15/app-audio.webm", Buffer.from(audio.bytes));
  const offset = Math.max(0, (audio.start - videoEpoch) / 1000).toFixed(3);
  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      rawVideo,
      "-itsoffset",
      offset,
      "-i",
      "work/phase15/app-audio.webm",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "24",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      "-shortest",
      `${dir}/cinematic-demo.mp4`,
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) throw new Error(result.stderr.slice(-1500));
} else await copyFile(rawVideo, `${dir}/cinematic-demo.webm`);

// Responsive captures and measured RAF responsiveness without video recording overhead.
const measurements = [];
for (const [name, width, height] of [
  ["tablet", 820, 1180],
  ["mobile", 390, 844],
  ["narrow", 320, 700],
]) {
  const p = await browser.newPage({ viewport: { width, height } });
  await p.goto(base);
  await p.getByRole("dialog", { name: "Welcome to ShoreMigo" }).waitFor();
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `${dir}/welcome-${name}.png` });
  if (name === "narrow") {
    await p
      .getByRole("dialog")
      .getByRole("button", { name: "Continue" })
      .scrollIntoViewIfNeeded();
    await p.screenshot({ path: `${dir}/preferences-narrow.png` });
  }
  await p.getByRole("dialog").getByRole("button", { name: "Skip" }).click();
  await p.waitForTimeout(1000);
  await p.screenshot({ path: `${dir}/home-${name}.png` });
  const data = await p.evaluate(async () => {
    const times = [];
    const longTasks = [];
    let shifts = 0;
    const tasks = new PerformanceObserver((list) =>
      list.getEntries().forEach((e) => longTasks.push(e.duration)),
    );
    const layout = new PerformanceObserver((list) =>
      list.getEntries().forEach((e) => {
        if (!e.hadRecentInput) shifts += e.value;
      }),
    );
    tasks.observe({ type: "longtask" });
    layout.observe({ type: "layout-shift" });
    const started = performance.now();
    let last = started;
    await new Promise((resolve) => {
      const frame = (now) => {
        times.push(now - last);
        last = now;
        if (now - started < 2500) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
    tasks.disconnect();
    layout.disconnect();
    times.shift();
    times.sort((a, b) => a - b);
    return {
      frames: times.length,
      meanIntervalMs: times.reduce((a, b) => a + b, 0) / times.length,
      p95IntervalMs: times[Math.floor(times.length * 0.95)],
      longTasks: longTasks.length,
      maxLongTaskMs: Math.max(0, ...longTasks),
      cls: shifts,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  measurements.push({ viewport: name, width, height, ...data });
  await p.locator("#golden-hour").scrollIntoViewIfNeeded();
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${dir}/golden-hour-${name}.png` });
  await p.close();
}
const desktop = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
});
await desktop.addInitScript(() => {
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
});
await desktop.goto(base);
await desktop
  .locator('[data-migo-stage][data-expression="walking"]')
  .waitFor({ timeout: 20000 });
const desktopMetrics = await desktop.evaluate(async () => {
  const deltas = [];
  let previous = performance.now();
  const start = previous;
  await new Promise((resolve) => {
    const frame = (now) => {
      deltas.push(now - previous);
      previous = now;
      if (now - start < 2500) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
  deltas.shift();
  deltas.sort((a, b) => a - b);
  return {
    frames: deltas.length,
    meanIntervalMs: deltas.reduce((a, b) => a + b, 0) / deltas.length,
    p95IntervalMs: deltas[Math.floor(deltas.length * 0.95)],
  };
});
measurements.unshift({
  viewport: "desktop",
  width: 1440,
  height: 1000,
  ...desktopMetrics,
});
await writeFile(
  `${dir}/performance.json`,
  JSON.stringify(
    {
      environment:
        "Headless system Chromium in managed Linux; desktop viewport emulation, not physical device or GPU benchmarks. Short RAF samples, not proof of universally sustained 60fps. Recording captures actual app animation; audio is the app output after explicit opt-in.",
      measurements,
      browserErrors: errors,
    },
    null,
    2,
  ) + "\n",
);
await browser.close();
console.log(
  JSON.stringify(
    {
      recording: `${dir}/cinematic-demo.mp4`,
      screenshots: dir,
      measurements,
      browserErrors: errors,
    },
    null,
    2,
  ),
);

import { expect, test } from "@playwright/test";

// External editorial media is hotlinked from Wikimedia. When that host is unreachable the designed
// illustration must replace every photograph, including failures that happen before hydration.
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    sessionStorage.setItem("sm.intro", "1");
    sessionStorage.setItem("sm_prefs", JSON.stringify({ lang: "en", country: null, remember: false, welcomed: true }));
  });
  await context.route(/wikimedia\.org/, (route) => route.abort("failed"));
});

async function scrollThrough(page: import("@playwright/test").Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); }
  });
}

async function noBrokenRemoteImages(page: import("@playwright/test").Page) {
  const broken = await page.evaluate(() =>
    [...document.images].filter((i) => /wikimedia/.test(i.src) && i.complete && i.naturalWidth === 0 && i.getBoundingClientRect().width > 0).length,
  );
  expect(broken).toBe(0);
}

test("excursion photographs fall back to illustrations when the media host is down", async ({ page }) => {
  await page.goto("/excursions", { waitUntil: "load" });
  await scrollThrough(page);
  const slots = page.locator("[data-excursion-media]");
  await expect(slots.first()).toBeVisible();
  await expect(page.locator('[data-excursion-media="photograph"]')).toHaveCount(0, { timeout: 15_000 });
  await noBrokenRemoteImages(page);

  await page.goto("/excursions/coz-palancar-snorkel", { waitUntil: "load" });
  await expect(page.locator('[data-excursion-media="illustration"]')).toHaveCount(1, { timeout: 15_000 });
  await noBrokenRemoteImages(page);
});

test("discovery photograph and opt-in film show an honest unavailable notice when the host is down", async ({ page }) => {
  await page.goto("/discover/reef", { waitUntil: "load" });
  await scrollThrough(page);
  await expect(page.getByText("Photograph temporarily unavailable")).toBeVisible({ timeout: 15_000 });
  await noBrokenRemoteImages(page);
  const load = page.getByRole("button", { name: "Load video" });
  await load.scrollIntoViewIfNeeded();
  await load.click();
  await page.locator("video").first().evaluate((v: HTMLVideoElement) => v.play().catch(() => {}));
  await expect(page.getByText("Video temporarily unavailable")).toBeVisible({ timeout: 15_000 });
});

test("culinary editorial photographs fall back without broken images", async ({ page }) => {
  await page.goto("/taste", { waitUntil: "load" });
  await scrollThrough(page);
  await page.waitForTimeout(1500);
  await noBrokenRemoteImages(page);
});

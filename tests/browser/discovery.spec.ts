import { expect, test, type Page } from "@playwright/test";

async function enter(page: Page, path: string) {
  await page.addInitScript(() => {
    sessionStorage.setItem("sm.intro", "1");
    sessionStorage.setItem("sm_prefs", JSON.stringify({ lang: "en", country: null, remember: false, welcomed: true }));
    localStorage.setItem("sm.migo.v1", JSON.stringify({ prefs: { proactive: true, motionPaused: false }, hidden: false }));
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(path);
  return errors;
}
const scrollToEnd = (page: Page) => page.evaluate(() => { const el = document.querySelector<HTMLElement>("[data-discovery]")!; scrollTo(0, el.offsetTop + el.offsetHeight - innerHeight); });

for (const [id, poi, tour, filter, other] of [
  ["reef", /Green sea turtle/, "Afternoon Reef & Sandbar", "Dive", /Southern stingrays/],
  ["canopy", /Canopy zipline/, "Jungle Canopy & Sloth Sanctuary", "Waterfalls", /Sloths/],
] as const) {
  test(`${id}: scroll entry reveals points of interest that route into real excursions`, async ({ page }) => {
    const errors = await enter(page, `/discover/${id}`);
    const stage = page.locator(`[data-discovery="${id}"]`);
    await expect(stage).toHaveAttribute("data-progress", "0.00");
    await expect(page.getByRole("button", { name: poi })).toHaveCount(1);
    await expect(page.getByRole("button", { name: poi })).toHaveCSS("opacity", "0");
    await scrollToEnd(page);
    await expect.poll(async () => Number(await stage.getAttribute("data-progress"))).toBeGreaterThan(0.9);
    await page.getByRole("button", { name: poi }).click();
    const panel = page.getByRole("dialog");
    await expect(panel.getByRole("link", { name: new RegExp(tour) })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await page.getByRole("button", { name: filter, exact: true }).click();
    await expect(page.getByRole("button", { name: filter, exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: other })).toHaveCSS("opacity", "0.25");
    await page.getByRole("button", { name: poi }).click();
    await panel.getByRole("link", { name: new RegExp(tour) }).click();
    await expect(page).toHaveURL(/\/excursions\//);
    expect(errors).toEqual([]);
  });
}

test("reduced motion skips the transition, keeps everything usable and hydrates cleanly", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = await enter(page, "/discover/reef");
  const stage = page.locator('[data-discovery="reef"]');
  await expect(stage).toHaveAttribute("data-progress", "1.00");
  await page.getByRole("button", { name: /Elkhorn coral garden/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Palancar Reef Morning Snorkel");
  await expect(page.getByText(/sightings are never guaranteed/).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("accessible list mirrors the scene and the excursions page links in", async ({ page }) => {
  await enter(page, "/discover/canopy");
  await expect(page.getByRole("heading", { name: "Everything in this scene" })).toBeVisible();
  await expect(page.locator("li h3")).toHaveText(["Canopy zipline", "Sloths", "Cascading falls", "Jade swimming holes", "Lagoon and coastal wildlife"]);
  await page.goto("/excursions");
  await expect(page.locator("[data-discovery-links]").getByRole("link", { name: /Underwater reef/ })).toHaveAttribute("href", "/discover/reef");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/discover/reef");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

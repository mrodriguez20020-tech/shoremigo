import { expect, test, type Page } from "@playwright/test";

async function returning(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem("sm.intro", "1");
    sessionStorage.setItem("sm_prefs", JSON.stringify({ lang: "en", country: null, remember: false, welcomed: true }));
    localStorage.setItem("sm.migo.v1", JSON.stringify({ prefs: { proactive: false, motionPaused: false }, hidden: false }));
  });
  await page.goto("/taste");
}
test("same dish photo expands; native modal traps focus and restores opener/scroll", async ({ page }) => {
  await returning(page);
  const opener = page.getByRole("button", { name: "Explore Doubles", exact: true }).first();
  await opener.focus(); await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Doubles", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("img")).toHaveAttribute("src", /\/culinary\/doubles-2400\.webp$/);
  await expect(page.getByRole("button", { name: "Close dish details" })).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  for (let i = 0; i < 10; i++) await page.keyboard.press("Tab");
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest("dialog")))).toBe(true);
  await page.keyboard.press("Escape"); await expect(dialog).not.toBeVisible(); await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});
test("previous/next and keyboard navigation announce the actual subject", async ({ page }) => {
  await returning(page);
  await page.getByRole("button", { name: "Explore Doubles", exact: true }).first().click();
  let dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Next dish" }).click();
  await expect(dialog.getByRole("heading", { name: "Cochinita pibil", exact: true })).toBeVisible();
  await expect(dialog.locator("img")).toHaveAttribute("src", /\/culinary\/cochinita-2400\.webp$/);
  await page.keyboard.press("ArrowLeft");
  dialog = page.getByRole("dialog", { name: "Doubles", exact: true });
  await expect(dialog.getByRole("status")).toContainText("1 / 3");
  await expect(dialog).toContainText("CC BY-SA 4.0");
});
test("filtering limits gallery navigation to the selected region", async ({ page }) => {
  await returning(page);
  await page.getByRole("button", { name: "Jamaica", exact: true }).click();
  const grid = page.locator("#flavours");
  await expect(grid.getByRole("button", { name: "Explore Doubles", exact: true })).toHaveCount(0);
  await grid.getByRole("button", { name: "Explore Jerk chicken", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("status")).toContainText("1 / 2");
});
test("menu roving tabs: Arrow/Home/End, associations, accurate sample prices and alcohol labels", async ({ page }) => {
  await returning(page);
  const menu = page.locator("#restaurants");
  const tabs = menu.getByRole("tab");
  await tabs.first().focus(); await page.keyboard.press("End");
  await expect(tabs.last()).toBeFocused(); await expect(tabs.last()).toHaveAttribute("aria-selected", "true");
  await expect(menu.getByRole("tabpanel")).toContainText("Caribbean black cake");
  await expect(menu.getByRole("tabpanel")).toContainText("$7.50");
  await expect(menu.getByRole("tabpanel")).toContainText("Contains alcohol");
  await page.keyboard.press("Home"); await expect(tabs.first()).toBeFocused();
  await expect(menu.getByRole("tabpanel")).toContainText("$7.00");
  await page.keyboard.press("ArrowRight"); await expect(tabs.nth(1)).toBeFocused();
  await expect(menu.getByRole("tabpanel")).toContainText("Doubles (two)");
  const activeId = await tabs.nth(1).getAttribute("id");
  await expect(menu.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", activeId!);
  expect(await tabs.evaluateAll((els) => els.filter((el) => el.getAttribute("tabindex") === "0").length)).toBe(1);
});
test("sample menu illustrations stay distinct from guide photos and can expand", async ({ page }) => {
  await returning(page);
  await page.locator("#restaurants").getByRole("button", { name: "Explore Baleada sencilla", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Baleada sencilla", exact: true });
  await expect(dialog).toContainText("$7.00");
  await expect(dialog).toContainText("Fictional demo menu");
  await expect(dialog.locator('[data-media-kind="illustration"]')).toBeVisible();
});
test("photo failure retains a named usable illustration and disclosure", async ({ page }) => {
  await page.route("**/culinary/doubles-*.webp", (route) => route.abort());
  await returning(page);
  await page.getByRole("button", { name: "Explore Doubles", exact: true }).first().click();
  await expect(page.getByRole("dialog").locator('[data-media-kind="illustration"]')).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Photo unavailable");
});
test("Ask Migo closes modal and opens the contextual concierge", async ({ page }) => {
  await page.route("**/api/concierge", (route) => route.fulfill({ json: { text: "This is a fictional sample menu. Browse the catalog for bookable food tours.", cards: [], mood: "speaking", toolsUsed: ["get_dining_guide"], engine: "offline" } }));
  await returning(page);
  await page.getByRole("button", { name: "Explore Doubles", exact: true }).first().click();
  const request = page.waitForRequest((r) => r.url().endsWith("/api/concierge") && r.method() === "POST");
  await page.getByRole("button", { name: "Ask Migo about this dish" }).click();
  expect((await request).postDataJSON().history.at(-1).text).toContain("Doubles");
  await expect(page.getByRole("dialog", { name: "Doubles", exact: true })).not.toBeVisible();
  await expect(page.getByRole("dialog", { name: "Migo", exact: true })).toBeVisible();
});
test("food tour reservation uses existing route, server price and unavailable-provider behavior", async ({ page }) => {
  await returning(page);
  await page.getByRole("link", { name: "View timing & reserve" }).click();
  await expect(page).toHaveURL(/\/excursions\/coz-cacao/);
  await page.getByLabel("First name", { exact: true }).fill("Review");
  await page.getByLabel("Last name", { exact: true }).fill("Culinary");
  await page.getByLabel("Email", { exact: true }).fill("culinary@example.com");
  const created = page.waitForResponse((r) => r.url().endsWith("/api/bookings") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Continue to secure checkout" }).click();
  expect((await (await created).json()).booking).toMatchObject({ guests: 2, totalCents: 13000, status: "pending_payment" });
  await expect(page).toHaveURL(/\/checkout\//);
  await expect(page.getByText("$130.00", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/PayPal sandbox isn.t configured/i)).toBeVisible();
});
test("shared MenuViewer remains usable in Ships & Rooms", async ({ page }) => {
  await returning(page); await page.goto("/ships");
  await page.getByRole("tab", { name: "Dining", exact: true }).click();
  const tabs = page.getByRole("tablist", { name: "Compass Rose Dining Room menu sections" });
  await tabs.getByRole("tab").first().focus(); await page.keyboard.press("End");
  await expect(tabs.getByRole("tab").last()).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("Key lime pie", { exact: true })).toBeVisible();
});
for (const [width,height] of [[320,700],[390,844],[820,1180],[1440,1000]]) test(`layout, dialog and visible focus at ${width}×${height}`, async ({ page }) => {
  await page.setViewportSize({ width,height }); await returning(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  await page.getByRole("button", { name: "Explore Doubles", exact: true }).first().click();
  const dialog = page.getByRole("dialog"); await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.getByRole("button", { name: "Close dish details" }).click();
  await expect(dialog).not.toBeVisible();
});
test("reduced motion opens without transform animations and cleans up on navigation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" }); await returning(page);
  await page.getByRole("button", { name: "Explore Doubles", exact: true }).first().click();
  expect(await page.getByRole("dialog").evaluate((el) => el.getAnimations({ subtree:true }).length)).toBe(0);
  await page.goto("/excursions");
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

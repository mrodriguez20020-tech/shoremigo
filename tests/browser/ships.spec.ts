import { expect, test, type Page } from "@playwright/test";

async function enter(page: Page, motionPaused = false) {
  await page.addInitScript((motionPaused) => {
    sessionStorage.setItem("sm.intro", "1");
    sessionStorage.setItem("sm_prefs", JSON.stringify({ lang: "en", country: null, remember: false, welcomed: true }));
    localStorage.setItem("sm.migo.v1", JSON.stringify({ prefs: { proactive: false, motionPaused }, hidden: false }));
  }, motionPaused);
  await page.goto("/ships");
  await expect(page.getByRole("heading", { name: "Step aboard the Aurora Tide." })).toBeVisible();
}
const tabButton = (page: Page, name: string) => page.getByRole("tablist", { name: "Ship sections" }).getByRole("tab", { name });
// A click that lands before hydration is dropped by React; retry until the tab reports selected.
const tab = (page: Page, name: string) => ({
  click: () => expect(async () => {
    await tabButton(page, name).click();
    await expect(tabButton(page, name)).toHaveAttribute("aria-selected", "true", { timeout: 1500 });
  }).toPass({ timeout: 20000 }),
});
const canvasInk = (page: Page) => page.locator('[data-cabin="7214"] canvas').evaluate((c: HTMLCanvasElement) => {
  const ctx = c.getContext("2d")!, d = ctx.getImageData(0, 0, c.width, c.height).data, seen = new Set<number>();
  for (let i = 0; i < d.length; i += 4 * 997) seen.add((d[i] >> 4) * 256 + (d[i + 1] >> 4) * 16 + (d[i + 2] >> 4));
  return seen.size;
});

test("overview states the canonical design basis, not the old demo figures", async ({ page }) => {
  await enter(page);
  const panel = page.getByRole("tabpanel");
  await expect(panel).toContainText("158 m");
  await expect(panel).toContainText("104 · ≈208 guests");
  await expect(panel).toContainText("9 (7 above the waterline)");
  await expect(panel).not.toContainText(/1,900|14 \(11 shown\)/);
  await expect(page.getByRole("img", { name: /port elevation/ })).toBeVisible();
});

test("nine-deck explorer: keyboard deck selection, per-deck plans and stateroom selection", async ({ page }) => {
  await enter(page);
  await tab(page, "Decks").click();
  const decks = page.getByRole("button", { name: /^Deck \d: / });
  await expect(decks).toHaveCount(7);
  await page.getByRole("button", { name: "Deck 4: Oceanview" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: /^Cabin 4\d{3},/ })).toHaveCount(28);
  await expect(page.getByRole("tabpanel")).toContainText("Boutique entertainment lounge");
  await page.getByRole("button", { name: "Deck 7: Meridian" }).click();
  await expect(page.getByRole("button", { name: /^Cabin 7\d{3},/ })).toHaveCount(30);
  await page.getByRole("button", { name: /^Cabin 7305,/ }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Balcony 1.86 m deep");
  await page.getByRole("button", { name: /^Cabin 7214,/ }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Balcony 2.10 m deep · 9.00 m²");
  await page.getByRole("button", { name: "Explore Cabin 7214 →" }).click();
  await expect(page.locator('[data-cabin="7214"]')).toBeVisible();
});

test("rooms show only the approved categories; Tidekeeper Suite is future-only", async ({ page }) => {
  await enter(page);
  await tab(page, "Rooms").click();
  const panel = page.getByRole("tabpanel");
  await expect(panel.getByRole("heading", { level: 3 })).toHaveText(["Oceanview Stateroom", "Premium Balcony Stateroom", "Signature Cabin 7214"]);
  await expect(panel).toContainText("Tidekeeper Suite: future design concept only");
  await expect(panel).not.toContainText(/Interior Stateroom|9214/);
  await tab(page, "Amenities").click();
  await expect(page.getByRole("tabpanel")).not.toContainText(/Tidewater Theatre|Kids' splash zone \(|Deck 11/);
  await tab(page, "Dining").click();
  await page.getByRole("button", { name: "Sea Glass Grill" }).click();
  await expect(page.locator(".ship-explorer")).toContainText("Deck 7 aft pool terrace");
  await page.getByRole("button", { name: "Nightwatch Patisserie" }).click();
  await expect(page.locator(".ship-explorer")).toContainText("Deck 5 promenade");
});

test("Cabin 7214: viewpoints, zones, lighting and keyboard all drive one spatial view", async ({ page }) => {
  await enter(page);
  await tab(page, "Cabin 7214").click();
  const cabin = page.locator('[data-cabin="7214"]'), canvas = cabin.locator("canvas");
  await expect(cabin.getByRole("tab")).toHaveCount(6);
  await expect(canvas).toHaveAttribute("data-view", "V1-entry");
  await expect.poll(() => canvasInk(page)).toBeGreaterThan(12);
  await cabin.getByRole("tab", { name: /V5 · Balcony · sea/ }).click();
  await expect(canvas).toHaveAttribute("data-view", "V5-balcony-out");
  await cabin.getByRole("button", { name: "Bathroom" }).click();
  await expect(canvas).toHaveAttribute("data-view", "V4-bathroom");
  await expect(cabin).toContainText("pocket sliding door");
  await cabin.getByRole("group", { name: /spatial view/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(canvas).toHaveAttribute("data-view", "V5-balcony-out");
  for (const [label, value] of [["Sunset", "golden hour"], ["Evening", "evening"], ["Daylight", "daylight"]]) {
    await cabin.getByRole("radio", { name: label }).click();
    await expect(canvas).toHaveAttribute("data-light", value);
  }
  await expect(cabin).toContainText("not a photoreal render");
  await expect(cabin).toContainText("7212 · 7302");
});

test("reduced motion and phone layout keep the cabin usable without overflow", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page);
  await tab(page, "Cabin 7214").click();
  const cabin = page.locator('[data-cabin="7214"]');
  await cabin.getByRole("tab", { name: /V3 · Living area/ }).click();
  await expect(cabin.locator("canvas")).toHaveAttribute("data-view", "V3-living");
  await expect.poll(() => canvasInk(page)).toBeGreaterThan(12);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('Cabin 7214 respects saved manual pause and cancels a live camera glide',async({page})=>{
 await page.addInitScript(()=>{const probe=window as unknown as {cabinPaints:number};probe.cabinPaints=0;const fill=CanvasRenderingContext2D.prototype.fillRect;CanvasRenderingContext2D.prototype.fillRect=function(...a){if(this.canvas.hasAttribute('data-view'))probe.cabinPaints++;return fill.apply(this,a);};});
 await enter(page,true);await tab(page,'Cabin 7214').click();const cabin=page.locator('[data-cabin="7214"]');await cabin.getByRole('tab',{name:/V3 · Living area/}).click();await expect(cabin.locator('canvas')).toHaveAttribute('data-view','V3-living');await page.waitForTimeout(100);
 const count=()=>page.evaluate(()=>(window as unknown as {cabinPaints:number}).cabinPaints);let before=await count();await page.waitForTimeout(350);expect(await count()).toBe(before);
 await page.getByRole('button',{name:/Sound and experience settings/}).click();let pause=page.getByRole('switch',{name:/Pause animations/});await pause.focus();await page.keyboard.press('Space');await expect(pause).not.toBeChecked();await page.getByRole('button',{name:/Sound and experience settings/}).click();
 await cabin.getByRole('tab',{name:/V5 · Balcony · sea/}).click();await page.getByRole('button',{name:/Sound and experience settings/}).click();pause=page.getByRole('switch',{name:/Pause animations/});await pause.focus();await page.keyboard.press('Space');await expect(pause).toBeChecked();await page.waitForTimeout(100);before=await count();await page.waitForTimeout(350);expect(await count()).toBe(before);
});

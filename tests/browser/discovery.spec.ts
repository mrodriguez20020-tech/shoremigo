import { expect, test, type Page } from "@playwright/test";

async function enter(page: Page, path: string, motionPaused = false) {
  await page.addInitScript((motionPaused) => {
    sessionStorage.setItem("sm.intro", "1");
    sessionStorage.setItem("sm_prefs", JSON.stringify({ lang: "en", country: null, remember: false, welcomed: true }));
    localStorage.setItem("sm.migo.v1", JSON.stringify({ prefs: { proactive: true, motionPaused }, hidden: false }));
  }, motionPaused);
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

for(const width of [320,390])test(`${width}px: actual mobile filter targets and detail controls remain tappable`,async({page})=>{
 await page.setViewportSize({width,height:700});await page.emulateMedia({reducedMotion:'reduce'});await enter(page,'/discover/canopy');
 const filter=page.getByRole('button',{name:'Wildlife',exact:true});await filter.click();await expect(filter).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('dialog')).toHaveCount(0);
 const sloth=page.getByRole('button',{name:/Sloths: Slow/});await sloth.click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('button',{name:'Close',exact:true})).toBeFocused();
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(sloth).toBeFocused();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);
});
test('native focus scrolling cannot send an opened canopy point back into entry mode',async({page})=>{
 await enter(page,'/discover/canopy');await scrollToEnd(page);await expect.poll(async()=>Number(await page.locator('[data-discovery]').getAttribute('data-progress'))).toBeGreaterThan(.9);
 const point=page.getByRole('button',{name:/Canopy zipline:/});
 await point.evaluate(button=>button.addEventListener('focus',()=>{const stage=document.querySelector<HTMLElement>('[data-discovery]')!;scrollTo({top:stage.offsetTop+stage.offsetHeight-innerHeight-240,behavior:'instant'});},{once:true}));
 await point.click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Waterfalls',exact:true})).toBeVisible();await expect(page.locator('[data-discovery]')).toHaveAttribute('data-progress','1.00');
});
test('global manual pause stops canvas life and resumes it only when requested',async({page})=>{
 await page.addInitScript(()=>{const probe=window as unknown as {discoveryPaints:number};probe.discoveryPaints=0;const clear=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...a){if(this.canvas.closest('[data-discovery]'))probe.discoveryPaints++;return clear.apply(this,a);};});
 await enter(page,'/discover/reef',true);await expect(page.locator('html')).toHaveAttribute('data-motion','reduced');await expect(page.locator('[data-discovery]')).toHaveAttribute('data-progress','1.00');
 const count=()=>page.evaluate(()=>(window as unknown as {discoveryPaints:number}).discoveryPaints);let before=await count();await page.waitForTimeout(350);expect(await count()).toBe(before);
 await page.getByRole('button',{name:/Sound and experience settings/}).click();const pause=page.getByRole('switch',{name:/Pause animations/});await pause.focus();await page.keyboard.press('Space');await expect(pause).not.toBeChecked();
 await page.locator('[data-discovery]').evaluate(el=>scrollTo({top:(el as HTMLElement).offsetTop+(el as HTMLElement).offsetHeight-innerHeight,behavior:'instant'}));await expect.poll(count).toBeGreaterThan(before);
 await pause.focus();await page.keyboard.press('Space');await expect(pause).toBeChecked();await page.waitForTimeout(100);before=await count();await page.waitForTimeout(350);expect(await count()).toBe(before);
});
test('the accessible discovery list hands off to the real excursion page',async({page})=>{
 await enter(page,'/discover/canopy');const heading=page.getByRole('heading',{name:'Everything in this scene'});await heading.scrollIntoViewIfNeeded();
 const list=heading.locator('..').locator('ul');await list.getByRole('link',{name:'Jungle Canopy & Sloth Sanctuary',exact:true}).first().click();await expect(page).toHaveURL(/\/excursions\/roa-canopy$/);await expect(page.getByRole('heading',{name:'Jungle Canopy & Sloth Sanctuary',exact:true})).toBeVisible();
});

import { expect, test, type Page } from "@playwright/test";

async function returning(page: Page, proactive = false) {
  await page.addInitScript((proactive) => {
    sessionStorage.setItem("sm.intro", "1");
    sessionStorage.setItem("sm_prefs", JSON.stringify({ lang: "en", country: null, remember: false, welcomed: true }));
    localStorage.setItem("sm.migo.v1", JSON.stringify({ prefs: { proactive, motionPaused: false }, hidden: false }));
    const sample = () => {
      const stage = document.querySelector<HTMLElement>("[data-migo-stage]");
      if (!stage || getComputedStyle(stage).visibility === "hidden") { requestAnimationFrame(sample); return; }
      const r = stage.getBoundingClientRect();
      (window as unknown as { firstVisibleMigo: { x: number; width: number; ready: string | undefined } }).firstVisibleMigo = { x: r.x, width: r.width, ready: stage.dataset.placementReady };
    };
    requestAnimationFrame(sample);
  }, proactive);
  await page.goto("/");
  await expect(page.locator("[data-migo-stage]")).toHaveAttribute("data-placement-ready", "true");
}

for (const width of [820, 1440]) {
  test(`${width}px: an existing suggestion cannot cover the golden subject or disclosure after scrolling`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await returning(page, true);
    const bubble = page.locator('[data-migo-stage] [role="status"]');
    await expect(bubble).toBeVisible();
    await page.setViewportSize({ width, height: 1000 });
    await page.locator(".golden-window").evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top, behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => {
      const tip = document.querySelector('[data-migo-stage] [role="status"]');
      if (!tip) return true;
      if (getComputedStyle(tip).visibility === "hidden") return true;
      const a = tip.getBoundingClientRect();
      return ["[data-cinematic-subject-safe]", ".golden-disclosure", ".golden-copy", ".golden-excursion"].every(selector => {
        const b = document.querySelector(selector)!.getBoundingClientRect();
        return a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom;
      });
    })).toBe(true);
  });
}

for (const width of [320, 390, 820]) {
  test(`${width}px: initial placement and launcher protect hero content as it scrolls`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error" && /hydration|server rendered|didn't match/i.test(message.text())) errors.push(message.text()); });
    await returning(page);
    await expect.poll(() => page.evaluate(() => Boolean((window as unknown as { firstVisibleMigo?: object }).firstVisibleMigo))).toBe(true);
    const first = await page.evaluate(() => (window as unknown as { firstVisibleMigo: { x: number; width: number; ready: string } }).firstVisibleMigo);
    expect(first.ready).toBe("true");
    expect(first.x).toBeGreaterThan(width / 2);
    const clear = () => page.evaluate(() => {
      const a = document.querySelector("[data-migo-stage]")!.getBoundingClientRect();
      return Array.from(document.querySelectorAll(".luxury-hero [data-migo-avoid]")).every(el => {
        const b = el.getBoundingClientRect();
        return a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom;
      });
    });
    for (const selector of [".hero-ocean-space", ".hero-actions", ".hero-proof"]) {
      await page.locator(selector).evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().bottom - innerHeight + 45, behavior: "instant" }));
      await expect(page.locator(selector).locator("..")).toHaveCSS("opacity", "1");
      await expect.poll(clear).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    const tagline = page.locator(".luxury-hero").getByText("Your adventure doesn't stop when plans change.", { exact: true });
    await tagline.evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().bottom - innerHeight + 45, behavior: "instant" }));
    await expect.poll(clear).toBe(true);
    expect(errors).toEqual([]);
    await page.getByRole("button", { name: "Open Migo, your AI concierge" }).click();
    await expect(page.getByRole("dialog", { name: "Migo", exact: true })).toBeVisible();
  });
}

test("batched enter/exit entries cannot leave a stale scene claim", async ({ page }) => {
  await page.addInitScript(() => {
    const registry: { callback: IntersectionObserverCallback; observer: IntersectionObserver; targets: Element[] }[] = [];
    (window as unknown as { sceneObservers: typeof registry }).sceneObservers = registry;
    const Native = window.IntersectionObserver;
    window.IntersectionObserver = class extends Native {
      targets: Element[] = [];
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super(callback, options);
        if (options?.rootMargin?.startsWith("-")) registry.push({ callback, observer: this, targets: this.targets });
      }
      observe(target: Element) { this.targets.push(target); super.observe(target); }
    };
  });
  await returning(page);
  await expect.poll(() => page.evaluate(() => (window as unknown as { sceneObservers: { targets: Element[] }[] }).sceneObservers.some(o => o.targets.some(t => t.id === "match")))).toBe(true);
  const verdicts = await page.evaluate(() => {
    const observer = (window as unknown as { sceneObservers: { callback: IntersectionObserverCallback; observer: IntersectionObserver; targets: Element[] }[] }).sceneObservers.find(o => o.targets.some(t => t.id === "match"))!;
    const target = document.querySelector("#match")!;
    const entry = (isIntersecting: boolean, time: number) => ({ target, isIntersecting, time } as IntersectionObserverEntry);
    observer.callback([entry(true, 100), entry(false, 101)], observer.observer);
    const first = document.documentElement.dataset.scene;
    observer.callback([entry(false, 201), entry(true, 200)], observer.observer);
    return [first, document.documentElement.dataset.scene];
  });
  expect(verdicts).toEqual(["day", "day"]);
});

for (const [width, height] of [[320, 700], [390, 844], [820, 1180], [1024, 768], [1440, 1000], [844, 390]]) {
  test(`${width}×${height}: golden copy, card, disclosure and Migo protect the cinematic subject`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await returning(page);
    await expect(page.getByRole("list", { name: "Why ShoreMigo" })).toContainText("LastBoard · cruise-aware timing");
    await expect(page.getByRole("list", { name: "Why ShoreMigo" })).toContainText("PayPal Sandbox · demo bookings");
    await expect(page.getByRole("list", { name: "Why ShoreMigo" })).toContainText("AI concierge · verified app tools");
    await page.locator(".golden-window").evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top, behavior: "instant" }));
    await expect(page.locator("html")).toHaveAttribute("data-scene", "sunset");
    await expect(page.locator(".golden-copy")).toHaveAttribute("data-golden-copy", "interim");
    await expect(page.locator(".golden-copy")).toContainText("Stay for the evening.");
    // Portrait editorial follows the vista; reveal it before measuring its final bounds.
    await page.locator(".golden-copy").scrollIntoViewIfNeeded();
    await expect(page.locator(".golden-copy").locator("..")).toHaveCSS("opacity", "1");
    await page.locator(".golden-window").evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top, behavior: "instant" }));
    const geometry = await page.evaluate(() => {
      const windowBox = document.querySelector(".golden-window")!.getBoundingClientRect();
      const card = document.querySelector(".golden-excursion")!.getBoundingClientRect();
      const copy = document.querySelector(".golden-copy")!.getBoundingClientRect();
      const subject = document.querySelector("[data-cinematic-subject-safe]")!.getBoundingClientRect();
      return { windowBottom: windowBox.bottom, cardTop: card.top, cardRight: card.right, copyRight: copy.right, copyTop: copy.top, copyBottom: copy.bottom, subjectLeft: subject.left };
    });
    expect(geometry.cardTop).toBeGreaterThanOrEqual(geometry.copyBottom);
    if (width >= 1024) {
      expect(geometry.copyRight).toBeLessThanOrEqual(geometry.subjectLeft);
      expect(geometry.cardRight).toBeLessThanOrEqual(geometry.subjectLeft);
    } else expect(geometry.copyTop).toBeGreaterThanOrEqual(geometry.windowBottom);
    await expect.poll(() => page.evaluate(() => {
      const a = document.querySelector("[data-migo-stage]")!.getBoundingClientRect();
      return [".golden-disclosure", "[data-cinematic-subject-safe]"].every(selector => {
        const b = document.querySelector(selector)!.getBoundingClientRect();
        return a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom;
      });
    })).toBe(true);
    await page.locator(".golden-excursion").evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().bottom - innerHeight + 30, behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => {
      const a = document.querySelector("[data-migo-stage]")!.getBoundingClientRect();
      const b = document.querySelector(".golden-excursion")!.getBoundingClientRect();
      return a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom;
    })).toBe(true);
    await page.locator(".golden-excursion").click();
    await expect(page).toHaveURL(/excursions\/och-sunset-sail/);
  });
}

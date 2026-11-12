import { expect, test, type Page } from "@playwright/test";

const settings = (page: Page) =>
  page.getByRole("button", { name: /Sound and experience settings/ });
async function returning(page: Page) {
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
    const evidence = {
      contacts: [] as { t: number; foot: string }[],
      sounds: [] as { t: number; kind: string }[],
    };
    (window as unknown as { motionEvidence: typeof evidence }).motionEvidence =
      evidence;
    window.addEventListener("sm:migo-contact", (event) =>
      evidence.contacts.push({
        t: performance.now(),
        foot: (event as CustomEvent).detail.foot,
      }),
    );
    window.addEventListener("sm:contact-sound", (event) =>
      evidence.sounds.push({
        t: performance.now(),
        kind: (event as CustomEvent).detail.kind,
      }),
    );
  });
  await page.goto("/");
}
const evidence = (page: Page) =>
  page.evaluate(
    () =>
      (
        window as unknown as {
          motionEvidence: {
            contacts: { t: number; foot: string }[];
            sounds: { t: number; kind: string }[];
          };
        }
      ).motionEvidence,
  );

test("welcome notices, takes the two supplied steps, waves, and can be skipped immediately", async ({
  page,
}) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Welcome to ShoreMigo" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Skip" })).toBeEnabled();
  await expect(page.locator("[data-greeting-phase]")).toHaveAttribute(
    "data-greeting-phase",
    "wave",
  );
  await dialog.getByRole("button", { name: "Skip" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.locator("[data-cinematic-backdrop]"),
  ).toBeVisible();
});

test("foot contacts alternate, travel holds at contact, and sound is off by default", async ({
  page,
}) => {
  test.setTimeout(35_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await returning(page);
  await expect
    .poll(async () => (await evidence(page)).contacts.length, {
      timeout: 20_000,
    })
    .toBeGreaterThanOrEqual(2);
  const result = await evidence(page);
  expect(result.contacts[0].foot).not.toBe(result.contacts[1].foot);
  expect(result.sounds).toHaveLength(0);
  // Observe the rendered event: Playwright's backoff polling can miss a 156 ms hold.
  const hold = await page.evaluate(() => new Promise<{ before: number; after: number; phase: string | undefined }>((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener("sm:migo-contact", onContact);
      reject(new Error("No rendered contact within 12 seconds"));
    }, 12000);
    function onContact() {
      window.removeEventListener("sm:migo-contact", onContact);
      requestAnimationFrame(() => {
        const stage = document.querySelector<HTMLElement>("[data-migo-stage]")!;
        const before = stage.getBoundingClientRect().x;
        setTimeout(() => {
          clearTimeout(timeout);
          resolve({ before, after: stage.getBoundingClientRect().x, phase: stage.dataset.gait });
        }, 50);
      });
    }
    window.addEventListener("sm:migo-contact", onContact);
  }));
  expect(hold.phase).toBe("contact");
  expect(Math.abs(hold.after - hold.before)).toBeLessThan(0.1);
  await settings(page).click();
  await page.getByText("Pause animations", { exact: true }).click();
  await expect(page.locator("[data-migo-stage]")).toHaveAttribute(
    "data-gait",
    "still",
  );
  const paused = await evidence(page);
  await page.waitForTimeout(800);
  expect((await evidence(page)).contacts).toHaveLength(paused.contacts.length);
});

test("opt-in contacts sound once per footfall; mute and reduced motion stop them", async ({
  page,
}) => {
  test.setTimeout(40_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await returning(page);
  await settings(page).click();
  await page.getByText("Enable sound", { exact: true }).click();
  await page.getByText("Ocean ambience", { exact: true }).click();
  await settings(page).click();
  await expect
    .poll(
      async () =>
        (await evidence(page)).sounds.filter((s) => s.kind === "motion:contact")
          .length,
      { timeout: 20_000 },
    )
    .toBeGreaterThanOrEqual(2);
  const result = await evidence(page);
  for (const sound of result.sounds.filter((s) => s.kind === "motion:contact"))
    expect(
      result.contacts.some((c) => sound.t >= c.t && sound.t - c.t < 100),
    ).toBeTruthy();
  await settings(page).click();
  await page.getByText("Migo's footsteps", { exact: true }).click();
  await settings(page).click();
  const muted = (await evidence(page)).sounds.length;
  await page.waitForTimeout(1300);
  expect((await evidence(page)).sounds).toHaveLength(muted);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-migo-stage]")).toHaveAttribute(
    "data-gait",
    "still",
  );
});

test("chat hop returns and an interrupted landing produces no duplicate sound", async ({
  page,
}) => {
  await returning(page);
  const stage = page.locator("[data-migo-stage]");
  await expect(stage).toHaveAttribute("data-placement-ready", "true");
  await page.evaluate(() => {
    const stage = document.querySelector("[data-migo-stage]")!;
    const history: string[] = [];
    (window as unknown as { hopHistory: string[] }).hopHistory = history;
    new MutationObserver(() => history.push(`${stage.getAttribute("data-mode")}:${stage.getAttribute("data-hopping")}`))
      .observe(stage, { attributes: true, attributeFilter: ["data-hopping", "data-mode"] });
  });
  await page.getByRole("button", { name: "Ask Migo", exact: true }).click();
  await expect(stage).toHaveAttribute("data-mode", "attend");
  await expect.poll(() => page.evaluate(() => (window as unknown as { hopHistory: string[] }).hopHistory)).toContain("attend:true");
  await page
    .getByRole("button", { name: "Close concierge", exact: true })
    .click();
  await expect(stage).toHaveAttribute("data-mode", "roam");
  await expect(stage).toHaveAttribute("data-hopping", "false");
  expect((await evidence(page)).sounds).toHaveLength(0);
});

test("rapid scrolling settles on the right scene and keeps the same vessel asset", async ({
  page,
}) => {
  await returning(page);
  const sources = await page
    .locator(".cinematic-poster")
    .evaluateAll((images) =>
      images.map((el) => (el as HTMLImageElement).getAttribute("src")),
    );
  expect(new Set(sources).size).toBe(1);
  for (const target of [
    "#golden-hour",
    "#match",
    "#golden-hour",
    "#ports",
    "#golden-hour",
  ]) {
    await page.locator(target).evaluate((el) =>
      window.scrollTo({
        top:
          window.scrollY +
          el.getBoundingClientRect().top +
          el.clientHeight / 2 -
          innerHeight / 2,
        behavior: "instant",
      }),
    );
    await page.waitForTimeout(45);
  }
  await expect(page.locator("html")).toHaveAttribute("data-scene", "sunset");
  expect(
    await page
      .locator("html")
      .evaluate((el) =>
        el.dataset.scene,
      ),
  ).toBe("sunset");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(page.locator("html")).toHaveAttribute("data-scene", "day");
});

for (const width of [820, 390, 320]) {
  test.describe(`pointer at ${width}px`, () => {
    test.use({ hasTouch: width < 720, isMobile: width < 720 });
    test(`${width}px layout is stable and Migo's touch launcher stays clear of controls`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await returning(page);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.locator(".hero-actions").scrollIntoViewIfNeeded();
      await expect.poll(() => page.evaluate(() => {
        const a = document
          .querySelector("[data-migo-stage]")!
          .getBoundingClientRect();
        return Array.from(
          document.querySelectorAll(
            ".hero-actions button,.hero-actions select",
          ),
        ).every((el) => {
          const b = el.getBoundingClientRect();
          return (
            a.right <= b.left ||
            a.left >= b.right ||
            a.bottom <= b.top ||
            a.top >= b.bottom
          );
        });
      })).toBe(true);
      const launcher = page.getByRole("button", {
        name: "Open Migo, your AI concierge",
      });
      if (width < 720) await launcher.tap();
      else await launcher.click();
      await expect(
        page.getByRole("dialog", { name: "Migo", exact: true }),
      ).toBeVisible();
    });
  });
}

test("checkout docks Migo and leaves payment controls visible without contact audio", async ({
  page,
  request,
}) => {
  await returning(page);
  const res = await request.post("/api/bookings", {
    data: {
      excursionId: "coz-cacao",
      guests: 1,
      firstName: "Visual",
      lastName: "Review",
      email: "visual-review@example.com",
    },
  });
  expect(res.status()).toBe(201);
  const data = await res.json();
  await page.goto(`/checkout/${data.booking.id}`);
  await expect(
    page.getByRole("heading", { name: "Confirm your adventure" }),
  ).toBeVisible();
  await expect(page.locator("[data-migo-stage]")).toHaveAttribute(
    "data-mode",
    "docked",
  );
  await expect(page.locator("[data-migo-stage]")).toHaveAttribute(
    "data-gait",
    "still",
  );
  expect((await evidence(page)).sounds).toHaveLength(0);
  await expect(
    page.getByText(/PayPal sandbox isn.t configured/i),
  ).toBeVisible();
});

test("desktop keyboard and drag release leave Migo clear of marked controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await returning(page);
  const launcher = page.getByRole("button", {
    name: "Open Migo, your AI concierge",
  });
  await expect(page.locator("[data-migo-stage]")).toHaveAttribute("data-placement-ready", "true");
  await launcher.focus();
  // Stop autonomous travel with a real keyboard action, then wait for the move to settle.
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => launcher.evaluate((el) => new Promise<number>((resolve) => {
    requestAnimationFrame(() => {
      const first = el.getBoundingClientRect().x;
      requestAnimationFrame(() => resolve(Math.abs(first - el.getBoundingClientRect().x)));
    });
  }))).toBeLessThan(0.1);
  const before = await launcher.boundingBox();
  await page.keyboard.press("ArrowLeft");
  await expect
    .poll(async () => (await launcher.boundingBox())!.x)
    .toBeLessThan(before!.x - 20);
  await page.locator(".hero-actions").evaluate((el) => {
    const rect = el.getBoundingClientRect();
    window.scrollTo({
      top: scrollY + rect.bottom - innerHeight + 10,
      behavior: "instant",
    });
  });
  const start = (await launcher.boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(240, start.y + start.height / 2, { steps: 8 });
  await page.mouse.up();
  const clear = await page.locator("[data-migo-stage]").evaluate((el) => {
    const a = el.getBoundingClientRect();
    return Array.from(document.querySelectorAll("[data-migo-avoid]")).every(
      (zone) => {
        const b = zone.getBoundingClientRect();
        return (
          a.right <= b.left ||
          a.left >= b.right ||
          a.bottom <= b.top ||
          a.top >= b.bottom
        );
      },
    );
  });
  expect(clear).toBe(true);
  await expect(
    page.getByRole("dialog", { name: "Migo", exact: true }),
  ).toHaveCount(0);
});

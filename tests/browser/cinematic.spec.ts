import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const previewDir = process.env.EVIDENCE_DIR;
if (previewDir) {
  if (!path.resolve(previewDir).startsWith(path.resolve("work/evidence") + path.sep)) throw new Error("EVIDENCE_DIR must be under ignored work/evidence.");
  fs.mkdirSync(previewDir, { recursive: true });
}

const welcome = (page: Page) =>
  page.getByRole("dialog", { name: "Welcome to ShoreMigo" });
const sessionPrefs = (page: Page) =>
  page.evaluate(() => JSON.parse(sessionStorage.getItem("sm_prefs") || "null"));

// These tests run against a production server: npm run build && npm start.
test("welcome traps focus, Escape skips, and country/language never persist without consent", async ({
  page,
}) => {
  await page.goto("/");
  const dialog = welcome(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("combobox")).toBeFocused();
  await expect(dialog.getByRole("checkbox")).not.toBeChecked();
  await dialog.getByRole("button", { name: "Begin exploring" }).focus();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Skip" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Begin exploring" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(await sessionPrefs(page)).toMatchObject({
    welcomed: true,
    remember: false,
    country: null,
  });
  expect(
    await page.evaluate(() => localStorage.getItem("sm_prefs")),
  ).toBeNull();
  await expect(page.locator("#main")).not.toHaveAttribute("inert", "");
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
});

test("country and language are independent; consent can be granted and revoked", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(welcome(page)).toBeVisible();
  await welcome(page).getByRole("combobox").selectOption("Trinidad and Tobago");
  await expect(
    page.getByRole("radio", { name: "English", exact: true }),
  ).toBeChecked();
  await page.getByRole("radio", { name: "English", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Español" })).toBeChecked();
  await expect(page.getByRole("dialog").getByRole("combobox")).toHaveValue(
    "Trinidad and Tobago",
  );
  await page.getByRole("dialog").getByRole("checkbox").check();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Empezar a explorar", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("sm_prefs") || "null"),
    ),
  ).toMatchObject({
    lang: "es",
    country: "Trinidad and Tobago",
    remember: true,
  });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "es", exact: true }).click();
  await page.getByRole("menuitem", { name: "Idioma y región" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("combobox")).toHaveValue(
    "Trinidad and Tobago",
  );
  await page.getByRole("dialog").getByRole("checkbox").uncheck();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Empezar a explorar", exact: true })
    .click();
  expect(
    await page.evaluate(() => localStorage.getItem("sm_prefs")),
  ).toBeNull();
  expect(await sessionPrefs(page)).toMatchObject({
    lang: "es",
    remember: false,
  });
});

test("blocked browser storage still permits entering the app", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("Storage blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Storage blocked");
    };
  });
  await page.goto("/");
  await expect(welcome(page)).toBeVisible();
  await welcome(page).getByRole("button", { name: "Begin exploring" }).click();
  await expect(welcome(page)).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your Caribbean adventure",
  );
});

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`${viewport.name}: responsive welcome, homepage, sunset and reduced motion`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(welcome(page)).toBeVisible();
    await expect(page.locator("[data-greeting-phase]")).toHaveAttribute("data-greeting-phase", "wave");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    expect(
      await welcome(page).evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBeTruthy();
    if (previewDir)
      await page.screenshot({
        path: `${previewDir}/welcome-${viewport.name}.png`,
      });
    await welcome(page).getByRole("button", { name: "Skip" }).click();
    await expect(welcome(page)).toHaveCount(0);
    await expect(page.locator("[data-migo-stage]")).toHaveAttribute("data-placement-ready", "true");
    if (viewport.name === "mobile") {
      await expect.poll(() => page.evaluate(() => {
        const stage = document
          .querySelector("[data-migo-stage]")!
          .getBoundingClientRect();
        return Array.from(
          document.querySelectorAll(
            ".hero-actions [data-migo-avoid], .hero-actions[data-migo-avoid]",
          ),
        ).every((el) => {
          const z = el.getBoundingClientRect();
          return (
            stage.right <= z.left ||
            stage.left >= z.right ||
            stage.bottom <= z.top ||
            stage.top >= z.bottom
          );
        });
      })).toBe(true);
    }
    if (previewDir)
      await page.screenshot({
        path: `${previewDir}/home-${viewport.name}.png`,
      });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.locator("#golden-hour").scrollIntoViewIfNeeded();
    await expect(page.locator("html")).toHaveAttribute("data-scene", "sunset");
    expect(
      await page.evaluate(() =>
        (() => {
          const value = getComputedStyle(document.documentElement)
            .getPropertyValue("--scene-dur")
            .trim();
          return parseFloat(value) * (value.endsWith("ms") ? 1 : 1000);
        })(),
      ),
    ).toBe(750);
    await expect(page.locator(".cinematic-poster")).toHaveCSS("opacity", "1");
    if (previewDir)
      await page.screenshot({
        path: `${previewDir}/sunset-${viewport.name}.png`,
      });
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(
      await page.evaluate(() =>
        (() => {
          const value = getComputedStyle(document.documentElement)
            .getPropertyValue("--scene-dur")
            .trim();
          return parseFloat(value) * (value.endsWith("ms") ? 1 : 1000);
        })(),
      ),
    ).toBe(1);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-intro", "done");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("hero port choice reaches inventory and concierge remains available", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await welcome(page).getByRole("button", { name: "Skip" }).click();
  await page.locator("#hero-port").selectOption("cozumel");
  await page
    .getByRole("button", { name: "Explore tours", exact: true })
    .click();
  await expect(page).toHaveURL(/excursions\?port=cozumel/);
  await expect(
    page.getByRole("heading", { name: /Your day in Cozumel/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ask Migo", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog", { name: /Migo/ })).toBeVisible();
});

test("manual pause stops scene transitions and an ultrawide sunset remains reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 2560, height: 900 });
  await page.goto("/");
  await welcome(page).getByRole("button", { name: "Skip" }).click();
  await page
    .getByRole("button", {
      name: "Sound and experience settings (sound off)",
      exact: true,
    })
    .click();
  await page.getByText("Pause animations", { exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await page
    .getByRole("button", {
      name: "Sound and experience settings (sound off)",
      exact: true,
    })
    .click();
  await page.locator("#golden-hour").scrollIntoViewIfNeeded();
  await expect(page.locator("html")).toHaveAttribute("data-scene", "sunset");
  await expect(page.locator(".cinematic-poster")).toHaveCSS("opacity", "1");
});

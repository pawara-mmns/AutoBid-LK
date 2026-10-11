import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const directory = "docs/design/stage-2-2026-10-11";

test("browse presentation at all five requested widths", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop-chromium", "One capture per width; interactions run in both browser projects.");
  await mkdir(`${directory}/screenshots`, { recursive: true });
  const mode = process.env.E2E_MARKETPLACE_FIXTURE ? "fixture" : "unconfigured";
  const observations = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && /hydration|didn't match|did not match/i.test(message.text())) errors.push(message.text()); });

  for (const width of [360, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 800 : 1024 });
    await page.goto("/vehicles");
    await expect(page.getByRole("heading", { name: "Find your vehicle", exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    if (mode === "fixture") await expect(page.locator("main article")).toHaveCount(12);
    await page.screenshot({ path: `${directory}/screenshots/${mode}-browse-${width}.png`, fullPage: true });
    await page.screenshot({ path: `${directory}/screenshots/${mode}-browse-${width}-viewport.png` });
    if (mode === "fixture") await page.locator("main article").first().screenshot({ path: `${directory}/screenshots/card-${width}.png` });
    const observation = await page.evaluate(() => {
      const visible = (element: Element) => element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0;
      const controls = Array.from(document.querySelectorAll("main button, main input:not([type=hidden]), main select, main summary")).filter(visible);
      const cards = Array.from(document.querySelectorAll("main article"));
      const firstImage = cards[0]?.firstElementChild?.firstElementChild?.getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        undersized: controls.filter((element) => element.getBoundingClientRect().height < 44).map((element) => element.textContent || element.id),
        cardWidths: cards.slice(0, 3).map((card) => card.getBoundingClientRect().width),
        imageRatio: firstImage ? firstImage.width / firstImage.height : null,
        linkCounts: cards.map((card) => card.querySelectorAll("a").length),
      };
    });
    expect(observation.overflow).toBe(false);
    expect(observation.undersized).toEqual([]);
    if (mode === "fixture") {
      expect(observation.linkCounts.every((count) => count === 1)).toBe(true);
      expect(observation.imageRatio).toBeCloseTo(4 / 3, 2);
      if (width < 640) expect(observation.cardWidths[0]).toBeGreaterThan(width - 44);
    }
    observations.push({ width, ...observation });
    if (width < 1024) {
      await page.getByRole("button", { name: "Filters", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Filters", exact: true });
      await expect(dialog).toBeVisible();
      await page.screenshot({ path: `${directory}/screenshots/${mode}-filters-${width}.png` });
      expect(await dialog.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(false);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Filters", exact: true })).toBeFocused();
    }
  }
  expect(errors).toEqual([]);
  await writeFile(`${directory}/${mode}-checks.json`, JSON.stringify({ observations, errors }, null, 2));
});

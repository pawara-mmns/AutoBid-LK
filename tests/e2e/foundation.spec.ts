import { expect, test } from "@playwright/test";

test("starter shell is usable and explicit about launch status", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/AutoBid LK/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your next car.");
  await page.screenshot({ path: test.info().outputPath("homepage.png"), fullPage: true });
  await expect(page.getByText("There are no vehicles or auctions available yet.", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "See what’s ahead" }).click();
  await expect(page).toHaveURL(/#our-approach$/);
  await expect(page.getByRole("heading", { name: "Buying or selling should feel straightforward." })).toBeInViewport();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
});

test("keyboard skip link and missing-page recovery work", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  const response = await page.goto("/missing-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This page isn’t here" })).toBeVisible();
  await page.getByRole("link", { name: "Go to homepage" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your next car.");
});

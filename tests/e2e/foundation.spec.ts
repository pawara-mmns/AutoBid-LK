import { expect, test } from "@playwright/test";

test("public shell is usable and explicit about bidding availability", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // React reports attribute hydration mismatches through console.error, not pageerror.
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat|server[- ]rendered HTML|didn.t match/i.test(message.text())) {
      errors.push(message.text());
    }
  });
  await page.goto("/");
  await expect(page).toHaveTitle(/AutoBid LK/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Find your next car.");
  await expect(page.getByRole("main").getByRole("link", { name: "Sell my vehicle", exact: false })).toHaveAttribute("href", "/sell");
  await expect(page.getByRole("heading", { name: "Bid when available", exact: true })).toBeVisible();
  const originalViewport = page.viewportSize();
  for (const width of [360, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 800 : 1024 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    const searchButton = await page.getByRole("button", { name: "Find vehicles", exact: true }).boundingBox();
    expect(searchButton).not.toBeNull();
    expect(searchButton!.y + searchButton!.height).toBeLessThanOrEqual(width < 768 ? 800 : 1024);
  }
  if (originalViewport) await page.setViewportSize(originalViewport);
  await page.screenshot({ path: test.info().outputPath("homepage.png"), fullPage: true });
  await expect(page.getByText("There are no live bids or auctions here yet.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Find vehicles", exact: true }).click();
  await expect(page).toHaveURL(/\/vehicles/);
  await expect(page.getByRole("heading", { name: "Find your vehicle", exact: true })).toBeVisible();
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
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Find your next car.");
});

test("extension-injected body attributes preserve hydration and navigation", async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat|server[- ]rendered HTML|didn.t match/i.test(message.text())) errors.push(message.text());
  });
  await page.addInitScript(() => {
    const inject = () => {
      if (!document.body) return false;
      document.body.setAttribute("__processed_c8761356-8f5b-4365-b536-036db1d82841__", "true");
      return true;
    };
    if (!inject()) {
      const observer = new MutationObserver(() => { if (inject()) observer.disconnect(); });
      observer.observe(document, { childList: true, subtree: true });
    }
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("body")).toHaveAttribute("__processed_c8761356-8f5b-4365-b536-036db1d82841__", "true");
  if (isMobile) {
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  }
  await page.getByRole("searchbox", { name: "Search by make or model" }).fill("Toyota");
  await page.getByRole("button", { name: "Find vehicles", exact: true }).click();
  await expect(page).toHaveURL(/\/vehicles\?q=Toyota/);
  await expect(page.getByRole("heading", { name: "Find your vehicle", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

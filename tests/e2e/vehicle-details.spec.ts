import { expect, test } from "@playwright/test";

test("detail errors preserve useful navigation without technical internals", async ({ page }) => {
  test.skip(!process.env.E2E_AUTH_UNCONFIGURED, "Unconfigured state only.");
  await page.goto("/vehicles/unconfigured-vehicle?from=%2Fvehicles%3Fdistrict%3DColombo");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("We couldn’t load this vehicle");
  await expect(page.locator("main")).not.toContainText(/PGRST|service_role|stack trace/);
  await page.getByRole("link", { name: "Back to vehicles", exact: true }).click();
  await expect(page).toHaveURL(/\/vehicles\?district=Colombo$/);
});

test.describe("approved fixture vehicle details", () => {
  test.skip(!process.env.E2E_MARKETPLACE_FIXTURE, "Test-only PostgreSQL fixtures required.");

  test("gallery supports keyboard, modal focus, thumbnails and natural image fit", async ({ page }) => {
    await page.goto("/vehicles/fixture-car-1");
    const gallery = page.getByRole("region", { name: "Vehicle photos", exact: true });
    const open = gallery.getByRole("button", { name: "View Toyota Aqua photos full screen", exact: true });
    await expect(gallery.getByRole("status").filter({ hasText: "Photo 1 of 2" })).toBeVisible();
    await expect(open.locator("img")).toHaveCSS("object-fit", "contain");
    await open.focus();
    await page.keyboard.press("ArrowRight");
    await expect(gallery.getByRole("status").filter({ hasText: "Photo 2 of 2" })).toBeVisible();
    await page.keyboard.press("Home");
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Toyota Aqua — Vehicle photos", exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Close photos", exact: true })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.getByRole("button", { name: "Next photo", exact: true })).toBeFocused();
    await dialog.getByRole("button", { name: "Next photo", exact: true }).click();
    await expect(dialog.getByRole("status").filter({ hasText: "Photo 2 of 2" })).toBeVisible();
    await expect(dialog.locator("img")).toHaveCSS("object-fit", "contain");
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(open).toBeFocused();
    await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
    await page.setViewportSize({ width: 1280, height: 1024 });
    await gallery.getByRole("button", { name: "Show photo 1", exact: true }).click();
    await expect(gallery.getByRole("button", { name: "Show photo 1", exact: true })).toHaveAttribute("aria-pressed", "true");
  });

  test("horizontal touch swipe changes photos without opening the viewer", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Chromium touch input is exercised in the mobile project.");
    await page.goto("/vehicles/fixture-car-1");
    const photo = page.getByRole("button", { name: "View Toyota Aqua photos full screen", exact: true });
    await photo.scrollIntoViewIfNeeded();
    const box = await photo.boundingBox();
    if (!box) throw new Error("Photo control missing");
    const session = await page.context().newCDPSession(page);
    const x = box.x + box.width * 0.8, y = box.y + box.height / 2;
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - 100, y }] });
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.getByRole("status").filter({ hasText: "Photo 2 of 2" })).toBeVisible();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await session.detach();
  });

  test("browse context returns safely and important disclosures precede specifications", async ({ page }) => {
    await page.goto("/vehicles?make=Toyota&district=Colombo&sort=price-asc");
    await page.getByRole("link", { name: "View details: Toyota Aqua, 2016", exact: true }).click();
    await expect(page).toHaveURL(/from=/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Toyota Aqua");
    const price = page.getByRole("region", { name: "Price and buying availability" });
    await expect(price).toContainText("Seller’s asking price");
    await expect(price).toContainText("LKR 1,000,000");
    await expect(price).toContainText("Bidding is coming soon");
    await expect(page.getByRole("button", { name: /Place a bid|Buy now|Sign in to continue/i })).toHaveCount(0);
    const condition = page.getByRole("region", { name: "Seller-declared condition", exact: true });
    await expect(condition).toContainText("Test disclosure: scratch on rear door.");
    await expect(condition).toContainText("have not been independently checked");
    expect(await page.evaluate(() => {
      const condition = document.getElementById("vehicle-condition"), specs = document.getElementById("vehicle-specifications");
      return !!(condition && specs && (condition.compareDocumentPosition(specs) & Node.DOCUMENT_POSITION_FOLLOWING));
    })).toBe(true);
    expect(await page.evaluate(() => {
      const specs = document.getElementById("vehicle-specifications"), description = document.getElementById("vehicle-description");
      return !!(specs && description && (specs.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING));
    })).toBe(true);
    await expect(page.getByRole("region", { name: "About this listing", exact: true })).toContainText("does not mean the vehicle has been inspected");
    await page.getByRole("link", { name: "Back to vehicles", exact: true }).click();
    await expect(page).toHaveURL(/make=Toyota&district=Colombo&sort=price-asc$/);
    await page.goto("/vehicles/fixture-car-1?from=https%3A%2F%2Fexternal.test");
    await expect(page.getByRole("link", { name: "Back to vehicles", exact: true })).toHaveAttribute("href", "/vehicles");
  });

  test("missing media and specifications are honest; failed images recover", async ({ page }) => {
    await page.goto("/vehicles/fixture-car-2");
    await expect(page.getByText("Photo not available").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /photos full screen/ })).toHaveCount(0);
    const specs = page.getByRole("region", { name: "Vehicle specifications", exact: true });
    await expect(specs.locator("div").filter({ has: page.getByText("Registration year", { exact: true }) })).toContainText("Not stated");
    await expect(specs.locator("div").filter({ has: page.getByText("Engine capacity", { exact: true }) })).toContainText("Not stated");
    await page.route("**/_next/image**", (route) => route.abort());
    await page.goto("/vehicles/fixture-car-1");
    await expect(page.getByRole("region", { name: "Vehicle photos", exact: true }).getByText("Photo not available").first()).toBeVisible();
  });

  test("full-size photos are only requested for the selected image", async ({ page }) => {
    const large: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.pathname === "/_next/image" && Number(url.searchParams.get("w")) > 256) large.push(url.searchParams.get("url") ?? "");
    });
    await page.goto("/vehicles/fixture-car-1");
    await page.getByRole("region", { name: "Vehicle photos", exact: true }).locator("img").first().evaluate((image: HTMLImageElement) => image.decode());
    expect(large.some((url) => url.endsWith("20000000-0000-4000-8000-000000000001"))).toBe(true);
    expect(large.some((url) => url.endsWith("20000000-0000-4000-8000-000000000002"))).toBe(false);
  });
});

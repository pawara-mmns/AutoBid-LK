import { expect, test } from "@playwright/test";

const listing = "10000000-0000-4000-8000-000000000001";
const photo = "20000000-0000-4000-8000-000000000001";

test("navigation and all footer/selling links resolve", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("link", { name: "Browse vehicles" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  } else await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name: "Browse vehicles" }).click();
  await expect(page.getByRole("heading", { name: "Find your vehicle", exact: true })).toBeVisible();
  for (const path of ["/about", "/contact", "/help", "/terms", "/privacy", "/sell"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Selling is coming soon" })).toBeVisible();
});

test("invalid filters and missing configuration fail safely", async ({ page }) => {
  await page.goto("/vehicles?minPrice=200&maxPrice=100&page=100000");
  await expect(page.getByRole("alert").filter({ hasText: "Please check your filters" })).toBeVisible();
  await page.goto("/vehicles/INVALID-identifier");
  await expect(page.getByRole("heading", { name: "This page isn’t here" })).toBeVisible();
  if (process.env.E2E_AUTH_UNCONFIGURED) {
    await page.goto("/vehicles");
    await expect(page.getByRole("heading", { name: "We couldn’t load vehicles" })).toBeVisible();
    await expect(page.getByText(/PGRST|stack trace|service_role/)).toHaveCount(0);
  }
});

test.describe("isolated genuine-query fixtures", () => {
  test.skip(!process.env.E2E_MARKETPLACE_FIXTURE, "Only the explicitly test-only loopback PostgreSQL adapter supplies fixture data.");

  test("search, sorting and pagination use the server query", async ({ page }) => {
    await page.goto("/vehicles");
    await expect(page.getByRole("status").filter({ hasText: "15 vehicles found" })).toBeVisible();
    await expect(page.locator("main article")).toHaveCount(12);
    await page.getByRole("link", { name: "Next page" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator("main article")).toHaveCount(3);
    await page.goto("/vehicles?sort=price-desc");
    await expect(page.locator("main article").first()).toContainText("LKR 15,000,000");
    await page.goto("/");
    await page.getByRole("searchbox", { name: "Search by make or model" }).fill("Toyota Aqua");
    await page.getByRole("button", { name: "Find vehicles", exact: true }).click();
    await expect(page.locator("main article")).toHaveCount(1);
    await expect(page.locator("main article")).toContainText("Toyota Aqua");
    await page.screenshot({ path: test.info().outputPath("filtered-vehicles.png"), fullPage: true });
  });

  test("mobile filters apply in the URL, clear and preserve keyboard access", async ({ page, isMobile }) => {
    await page.goto("/vehicles");
    let panel = page.getByRole("complementary", { name: "Filters" });
    if (isMobile) {
      await page.getByRole("button", { name: "Filters", exact: true }).click();
      panel = page.getByRole("dialog");
      await expect(panel).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(panel).not.toBeVisible();
      await expect(page.getByRole("button", { name: "Filters", exact: true })).toBeFocused();
      await page.getByRole("button", { name: "Filters", exact: true }).click();
    }
    await panel.getByLabel("Brand", { exact: true }).selectOption("Suzuki");
    await panel.getByLabel("District", { exact: true }).selectOption("Kandy");
    await panel.getByLabel("Price up to (LKR)", { exact: true }).fill("2500000");
    await panel.getByRole("button", { name: "Apply filters" }).click();
    await expect(page).toHaveURL(/make=Suzuki/);
    await expect(page).toHaveURL(/district=Kandy/);
    await expect(page.locator("main article")).toHaveCount(1);
    await expect(page.locator("main article")).toContainText("Suzuki Swift");
    await page.getByRole("link", { name: "Clear filters", exact: true }).first().click();
    await expect(page.locator("main article")).toHaveCount(12);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });

  test("details show real fixture data, gallery controls and honest bidding state", async ({ page, request }) => {
    await page.goto("/vehicles/fixture-car-1");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Toyota Aqua");
    await expect(page.getByText("LKR 1,000,000", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bidding is coming soon" })).toBeVisible();
    await expect(page.getByText("Test disclosure: scratch on rear door.")).toBeVisible();
    await page.getByRole("button", { name: "Show photo 2", exact: true }).click();
    await expect(page.getByRole("button", { name: "Show photo 2", exact: true })).toHaveAttribute("aria-pressed", "true");
    const image = await request.get(`/vehicle-images/${listing}/${photo}`);
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toBe("image/png");
    await page.screenshot({ path: test.info().outputPath("vehicle-detail.png"), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });

  test("tablet browsing and filters fit without horizontal scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Find vehicles", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.goto("/vehicles");
    await expect(page.locator("main article")).toHaveCount(12);
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await expect(page.getByRole("dialog").getByLabel("Brand", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.screenshot({ path: test.info().outputPath("tablet-vehicles.png"), fullPage: true });
  });

  test("hidden, unknown, image-free and empty results are handled", async ({ page, request }) => {
    for (const slug of ["hidden-fixture-1", "hidden-fixture-2", "hidden-fixture-3", "hidden-fixture-4", "hidden-fixture-5", "unknown-vehicle"]) {
      const response = await page.goto(`/vehicles/${slug}`);
      expect(response?.status()).toBe(404);
    }
    await page.goto("/vehicles/fixture-car-2");
    await expect(page.getByText("Photo not available").first()).toBeVisible();
    await page.goto("/vehicles?q=NoSuchCar");
    await expect(page.getByRole("heading", { name: "No vehicles match just yet" })).toBeVisible();
    expect((await request.get(`/vehicle-images/${listing}/20000000-0000-4000-8000-000000000003`)).status()).toBe(404);
    expect((await request.get("/vehicle-images/invalid/invalid")).status()).toBe(404);
  });

  test("advanced filters, dependent models, clear drafts and URL history work", async ({ page, isMobile }) => {
    await page.goto("/vehicles");
    let panel = page.getByRole("complementary", { name: "Filters" });
    if (isMobile) {
      await page.getByRole("button", { name: "Filters", exact: true }).click();
      panel = page.getByRole("dialog");
    }
    await panel.getByLabel("Brand", { exact: true }).selectOption("Toyota");
    await panel.getByLabel("Model", { exact: true }).selectOption("Aqua");
    await panel.getByLabel("Brand", { exact: true }).selectOption("Suzuki");
    await expect(panel.getByLabel("Model", { exact: true })).toHaveValue("");
    await expect(panel.getByLabel("Model", { exact: true }).locator('option[value="Aqua"]')).toHaveCount(0);
    await panel.getByRole("button", { name: "Clear all", exact: true }).click();
    await expect(panel.getByLabel("Brand", { exact: true })).toHaveValue("");
    if (isMobile) await expect(panel).toBeVisible();
    await panel.locator("summary").click();
    await panel.getByLabel("Fuel type", { exact: true }).selectOption("hybrid");
    await panel.getByLabel("Transmission", { exact: true }).selectOption("automatic");
    await panel.getByLabel("Mileage from (km)", { exact: true }).fill("31000");
    await panel.getByLabel("Mileage up to (km)", { exact: true }).fill("32000");
    await panel.getByRole("button", { name: "Apply filters" }).click();
    await expect(page).toHaveURL(/fuel=hybrid/);
    await expect(page.locator("main article")).toHaveCount(2);
    await page.reload();
    await expect(page.locator("main article")).toHaveCount(2);
    await page.getByRole("link", { name: "Remove Mileage up to (km): 32000", exact: true }).click();
    await expect(page.locator("main article")).toHaveCount(12);
    await page.goBack();
    await expect(page.locator("main article")).toHaveCount(2);
    await page.getByRole("link", { name: "Clear filters", exact: true }).click();
    await expect(page.locator("main article")).toHaveCount(12);
    await expect(page).toHaveURL(/\/vehicles$/);
  });

  test("search clear, all sort orders and one keyboard link per card", async ({ page }) => {
    await page.goto("/vehicles?q=Toyota+Aqu");
    const search = page.getByRole("searchbox", { name: "Search by make or model" });
    await expect(page.locator("main article")).toHaveCount(1);
    await page.getByRole("button", { name: "Clear search", exact: true }).click();
    await expect(search).toHaveValue("");
    await expect(search).toBeFocused();
    await search.press("Enter");
    await expect(page.locator("main article")).toHaveCount(12);
    for (const [sort, first] of [["price-desc", "LKR 15,000,000"], ["price-asc", "LKR 1,000,000"], ["year-desc", "Toyota Fixture 7"], ["newest", "Toyota Aqua"]] as const) {
      await page.getByLabel("Sort by", { exact: true }).selectOption(sort);
      await page.getByRole("button", { name: "Update order", exact: true }).click();
      await expect(page.locator("main article").first()).toContainText(first);
    }
    const card = page.locator("main article").first();
    await expect(card.getByRole("link")).toHaveCount(1);
    await expect(card).toContainText("Seller’s asking price");
    await expect(card).toContainText("Listing approved for display");
    await card.getByRole("link").focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/vehicles\/fixture-car-1$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Toyota Aqua");
  });

  test("invalid query displays defaults without pretending the database failed", async ({ page }) => {
    await page.goto("/vehicles?fuel=unsupported&maxMileage=-1&sort=bad&limit=999999&status=draft");
    await expect(page.locator("main").getByRole("alert")).toContainText("Please check your filters");
    await expect(page.locator("main article")).toHaveCount(12);
    await expect(page.locator("main")).not.toContainText("Hidden fixture brand");
    await expect(page.getByRole("heading", { name: "We couldn’t load vehicles" })).toHaveCount(0);
  });
});

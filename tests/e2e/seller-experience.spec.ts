import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
test.skip(!process.env.E2E_SELLER_FIXTURE, "Needs the isolated private PostgreSQL seller transport.");
async function signIn(page: import("@playwright/test").Page, email = `${randomUUID()}@example.invalid`) {
  await page.goto("/sign-in?next=%2Fseller%2Fvehicles"); await page.getByLabel("Email address", { exact: true }).fill(email); await page.getByLabel("Password", { exact: true }).fill("test-only-long-password"); await page.getByRole("button", { name: "Sign in", exact: true }).click(); await page.waitForURL("**/seller/vehicles");
}
async function create(page: import("@playwright/test").Page) { await page.getByRole("link", { name: "Sell Another Vehicle", exact: true }).click(); await page.getByRole("button", { name: "Start my listing", exact: true }).click(); await page.getByRole("heading", { name: "What vehicle are you selling?", exact: true }).waitFor(); }
async function vehicle(page: import("@playwright/test").Page) {
  for (const [label, value] of [["Brand", "Toyota"], ["Model", "Aqua"], ["Manufacture year", "2015"], ["Mileage in kilometres", "100000"]]) await page.getByLabel(label!, { exact: true }).fill(value!);
  await page.getByRole("group", { name: "Registered in Sri Lanka?", exact: true }).getByLabel("No", { exact: true }).check(); await page.getByLabel("Fuel type", { exact: true }).selectOption("hybrid"); await page.getByLabel("Transmission type", { exact: true }).selectOption("automatic");
}
async function condition(page: import("@playwright/test").Page) {
  await page.getByLabel("District", { exact: true }).selectOption("Colombo"); await page.getByLabel("Town / City", { exact: true }).fill("Nugegoda"); await page.getByLabel("Overall condition", { exact: true }).selectOption("good");
  for (const label of ["Known accident history", "Known flood damage", "Known mechanical issues", "Outstanding lease or finance"]) await page.getByRole("group", { name: label, exact: true }).getByLabel("No", { exact: true }).check();
}
async function photos(page: import("@playwright/test").Page) { for (const slot of ["Front of vehicle", "Back of vehicle", "Interior", "Dashboard / mileage"]) { await page.getByLabel(`Choose from Gallery: ${slot}`, { exact: true }).setInputFiles("tests/fixtures/vehicle-photo.png"); await expect(page.locator("main img")).toHaveCount(["Front of vehicle", "Back of vehicle", "Interior", "Dashboard / mileage"].indexOf(slot) + 1); } }
test("guest seller routes retain only a safe sign-in return", async ({ page }) => { await page.goto("/seller/vehicles"); await expect(page).toHaveURL(/sign-in.*next=%2Fseller%2Fvehicles/); await expect(page.getByRole("heading", { name: "My Vehicles", exact: true })).toHaveCount(0); });
test("brand search filters model suggestions and Other accepts a real model", async ({ page }) => {
  await signIn(page); await create(page); await page.getByLabel("Brand", { exact: true }).fill("Toyota"); await expect(page.locator('#seller-models option[value="Aqua"]')).toHaveCount(1);
  await page.getByLabel("Model", { exact: true }).fill("Other"); await page.getByLabel("Type another model", { exact: true }).fill("Unlisted trim"); await expect(page.getByLabel("Model", { exact: true })).toHaveValue("Other");
  await page.getByLabel("Brand", { exact: true }).fill("Honda"); await expect(page.getByLabel("Type another model", { exact: true })).toHaveCount(0); await expect(page.getByLabel("Model", { exact: true })).toHaveValue(""); await expect(page.locator('#seller-models option[value="Aqua"]')).toHaveCount(0); await expect(page.locator('#seller-models option[value="Fit"]')).toHaveCount(1);
});
test("partial autosave survives reload, Back and owned dashboard resume", async ({ page }) => {
  await signIn(page); await create(page); await page.getByLabel("Brand", { exact: true }).fill("Toyota"); await expect(page.getByRole("status")).toHaveText("Saved"); await page.reload(); await expect(page.getByLabel("Brand", { exact: true })).toHaveValue("Toyota");
  await page.getByRole("button", { name: "Continue", exact: true }).click(); await expect(page.getByText("Please complete this field.", { exact: true }).first()).toBeVisible(); await vehicle(page); await page.getByRole("button", { name: "Continue", exact: true }).click(); await expect(page.getByRole("heading", { name: "Tell us about your vehicle", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click(); await expect(page.getByLabel("Model", { exact: true })).toHaveValue("Aqua"); await page.getByRole("link", { name: "My Vehicles", exact: true }).click(); await page.getByRole("link", { name: "Continue listing", exact: true }).click(); await expect(page.getByLabel("Model", { exact: true })).toHaveValue("Aqua");
});
test("five-step journey stores private photos/prices and submits once for review", async ({ page }) => {
  await signIn(page); await create(page); const privateUrl = page.url(); await vehicle(page); await page.getByRole("button", { name: "Continue", exact: true }).click(); await condition(page);
  await page.getByRole("group", { name: "Known flood damage", exact: true }).getByLabel("Yes", { exact: true }).check(); await expect(page.getByLabel("Tell us about the flood damage", { exact: true })).toBeVisible(); await page.getByLabel("Tell us about the flood damage", { exact: true }).fill("Water reached the carpet; repaired.");
  await page.getByRole("button", { name: "Continue", exact: true }).click(); await photos(page); await page.getByRole("button", { name: "Use as cover", exact: true }).last().click(); await expect(page.getByText("Dashboard / mileage · Cover photo", { exact: true })).toBeVisible(); await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Expected selling price (LKR)", { exact: true }).fill("3,000,000.25"); await page.getByLabel("Lowest acceptable selling price (LKR)", { exact: true }).fill("2900000"); await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("LKR 2,900,000", { exact: true })).toBeVisible(); await page.getByLabel("Contact phone number", { exact: true }).fill("0771234567"); await page.getByRole("group", { name: "Are you the registered owner?", exact: true }).getByLabel("Yes", { exact: true }).check(); await page.getByLabel("I agree to the listing terms below", { exact: true }).check(); await page.getByLabel("I confirm that these details are accurate to the best of my knowledge", { exact: true }).check();
  await page.getByRole("button", { name: "Submit for Review", exact: true }).evaluate((button) => { if (button instanceof HTMLButtonElement) { button.click(); button.click(); } }); await expect(page.getByRole("heading", { name: "Submitted for Review", exact: true })).toBeVisible(); await page.getByRole("link", { name: "View My Vehicles", exact: true }).click(); await expect(page.getByText("Submitted for Review", { exact: true })).toBeVisible(); await page.getByRole("link", { name: "View submission", exact: true }).click(); await expect(page.getByRole("button", { name: "Submit for Review", exact: true })).toHaveCount(0);
  const preview = page.locator("main img").first(); const src = await preview.getAttribute("src"); const response = await page.request.get(src!); expect(response.headers()["cache-control"]).toContain("no-store");
  const stranger = await page.context().browser()!.newContext(); const other = await stranger.newPage(); await signIn(other); const forbidden = await other.goto(privateUrl); expect(forbidden?.status()).toBe(404); expect((await other.request.get(src!)).status()).toBe(404); await stranger.close();
  await page.goto("/vehicles"); await expect(page.locator("main")).not.toContainText("2,900,000");
});
test("failed autosave retains edits and retries without losing the current step", async ({ page }) => {
  await signIn(page); await create(page); await vehicle(page); await page.getByRole("button", { name: "Continue", exact: true }).click(); await expect(page.getByRole("status")).toHaveText("Saved");
  await page.route("**/seller/vehicles/*", async (route) => { if (route.request().headers()["next-action"]) await route.abort(); else await route.continue(); });
  await page.getByLabel("Town / City", { exact: true }).fill("Saved after retry"); await expect(page.locator("main").getByRole("alert")).toContainText("Failed to Save"); await expect(page.getByLabel("Town / City", { exact: true })).toHaveValue("Saved after retry");
  await page.unroute("**/seller/vehicles/*"); await page.getByRole("button", { name: "Try saving again", exact: true }).click(); await expect(page.getByRole("status")).toHaveText("Saved"); await page.reload(); await expect(page.getByLabel("Town / City", { exact: true })).toHaveValue("Saved after retry");
});
test("a stale window cannot silently overwrite newer saved details", async ({ page }) => {
  await signIn(page); await create(page); const second = await page.context().newPage(); await second.goto(page.url());
  await page.getByLabel("Brand", { exact: true }).fill("Toyota"); await expect(page.getByRole("status")).toHaveText("Saved"); await second.getByLabel("Brand", { exact: true }).fill("Honda"); await expect(second.locator("main").getByRole("alert")).toContainText("another window"); await second.getByRole("button", { name: "Reload saved draft", exact: true }).click(); await expect(second.getByLabel("Brand", { exact: true })).toHaveValue("Toyota"); await second.close();
});
test("unsupported photos are rejected and a valid retry/deletion works", async ({ page }) => {
  await signIn(page); await create(page); await vehicle(page); await page.getByRole("button", { name: "Continue", exact: true }).click(); await condition(page); await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Choose from Gallery: Front of vehicle", { exact: true }).setInputFiles({ name: "fake.jpg", mimeType: "image/jpeg", buffer: Buffer.from("malformed") }); await expect(page.locator("main").getByRole("alert")).toContainText("valid JPG");
  await page.getByLabel("Choose from Gallery: Front of vehicle", { exact: true }).setInputFiles("tests/fixtures/vehicle-photo.png"); await expect(page.locator("main img")).toHaveCount(1); await page.getByRole("button", { name: "Remove", exact: true }).click(); await expect(page.locator("main img")).toHaveCount(0);
});

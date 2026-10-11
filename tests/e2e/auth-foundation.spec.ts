import { expect, test } from "@playwright/test";

test("public homepage remains available without login", async ({ page, isMobile }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Find your next car.");
  if (isMobile) await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("link", { name: "My account" }).click();
  await expect(page).toHaveURL(/\/sign-in\?/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("guest cannot render account, password or administration pages", async ({ page }) => {
  for (const path of ["/account", "/account/password", "/admin"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/sign-in\?/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your account", exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Administration access", exact: true })).toHaveCount(0);
  }
});

test("missing configuration disables forms safely and permits account navigation", async ({ page }) => {
  test.skip(!process.env.E2E_AUTH_UNCONFIGURED, "Explicit no-config run; do not assume the developer's Supabase configuration.");
  await page.goto("/sign-in");
  await expect(page.getByRole("alert").filter({ hasText: "Accounts are temporarily unavailable." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeDisabled();
  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(page.getByLabel("Your name (optional)")).toHaveCount(0);
  await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account" })).toBeDisabled();
  await page.screenshot({ path: test.info().outputPath("sign-up.png"), fullPage: true });
  await page.getByRole("link", { name: "Already have an account? Sign in" }).click();
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page.getByRole("heading", { name: "Forgot your password?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send reset link" })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("invalid confirmation links show safe feedback without an external redirect", async ({ page }) => {
  await page.goto("/auth/confirm?token_hash=test-fixture&type=invite&next=https://evil.invalid");
  await expect(page).toHaveURL(/\/sign-in\?message=invalidLink/);
  await expect(page.getByRole("alert").filter({ hasText: "This link is invalid" })).toBeVisible();
  await page.goto("/auth/callback?next=//evil.invalid");
  await expect(page).toHaveURL(/\/sign-in\?message=invalidLink/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("private and authentication responses are not publicly cached", async ({ request }) => {
  for (const path of ["/account", "/admin", "/sign-in", "/auth/callback"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["referrer-policy"]).toBe("no-referrer");
  }
});

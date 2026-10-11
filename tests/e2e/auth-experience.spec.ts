import { expect, test } from "@playwright/test";

test("auth screens preserve safe return context and omit unsupported methods", async ({ page }) => {
  await page.goto("/sign-in?next=%2Fadmin");
  await page.getByRole("link", { name: "Create an account", exact: true }).click();
  await expect(page).toHaveURL(/sign-up\?next=%2Fadmin$/);
  await expect(page.locator("main input:not([type=hidden])")).toHaveCount(2);
  await expect(page.getByLabel("Your name (optional)")).toHaveCount(0);
  await page.getByRole("link", { name: "Already have an account? Sign in", exact: true }).click();
  await page.getByRole("link", { name: "Forgot password?", exact: true }).click();
  await expect(page).toHaveURL(/forgot-password\?next=%2Fadmin$/);
  await page.getByRole("link", { name: "Back to sign in", exact: true }).click();
  await expect(page).toHaveURL(/sign-in\?next=%2Fadmin$/);
  await page.goto("/sign-in?next=https%3A%2F%2Fevil.invalid");
  await expect(page.locator("input[name=next]")).toHaveValue("/account");
  await expect(page.getByRole("button", { name: /Google|Facebook|phone|OTP/i })).toHaveCount(0);
  await page.getByRole("link", { name: "Browse vehicles without signing in", exact: true }).click();
  await expect(page).toHaveURL(/\/vehicles$/);
});

test("password visibility and inline validation retain focus and input semantics", async ({ page }) => {
  test.skip(!!process.env.E2E_AUTH_UNCONFIGURED, "Inputs intentionally disabled without configuration.");
  await page.goto("/sign-up");
  const password = page.getByLabel("Password", { exact: true });
  await password.fill("short");
  await page.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(password).toHaveValue("short");
  await expect(password).toHaveAttribute("autocapitalize", "none");
  await expect(password).toHaveAttribute("spellcheck", "false");
  await page.getByRole("button", { name: "Hide password", exact: true }).click();
  await expect(password).toHaveAttribute("type", "password");
  await expect(password).toHaveAttribute("autocomplete", "new-password");
  await page.getByLabel("Email address", { exact: true }).fill("bad");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Check the highlighted details");
  await expect(page.getByLabel("Email address", { exact: true })).toBeFocused();
  await expect(page.getByLabel("Email address", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Use 12 to 128 characters for your password.", { exact: true })).toBeVisible();
});

test.describe("controlled Auth UI transport (not actual provider acceptance)", () => {
  test.skip(!process.env.E2E_AUTH_FIXTURE, "Explicit isolated Auth transport required.");
  const signIn = async (page: import("@playwright/test").Page, next = "/account") => {
    await page.goto(`/sign-in?next=${encodeURIComponent(next)}`);
    await page.getByLabel("Email address", { exact: true }).fill("test@example.invalid");
    await page.getByLabel("Password", { exact: true }).fill("test-only-long-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
  };

  test("registration instructions, resend cooldown and change-email recovery", async ({ page }) => {
    await page.clock.install();
    await page.goto("/sign-up");
    await page.getByLabel("Email address", { exact: true }).fill("existing@example.invalid");
    await page.getByLabel("Password", { exact: true }).fill("test-only-long-password");
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Check your email", exact: true })).toBeVisible();
    await expect(page.getByText("existing@example.invalid", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Send again in/ })).toBeDisabled();
    await page.clock.runFor(61_000);
    await page.getByRole("button", { name: "Send another email", exact: true }).click();
    await expect(page.getByRole("button", { name: /Send again in/ })).toBeDisabled();
    await page.getByRole("button", { name: "Use a different email", exact: true }).click();
    await expect(page.getByLabel("Email address", { exact: true })).toHaveValue("existing@example.invalid");
    await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
  });

  test("recovery is non-enumerating and allows a new request after cooldown", async ({ page }) => {
    await page.clock.install();
    await page.goto("/forgot-password");
    await page.getByLabel("Email address", { exact: true }).fill("unknown@example.invalid");
    await page.getByRole("button", { name: "Send reset link", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("If an account uses that email");
    await page.clock.runFor(61_000);
    await page.getByRole("button", { name: "Send another email", exact: true }).click();
    await expect(page.getByRole("button", { name: /Send again in/ })).toBeDisabled();
  });

  test("pending submissions, wrong credentials and throttling show safe feedback", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email address", { exact: true }).fill("slow@example.invalid");
    await page.getByLabel("Password", { exact: true }).fill("test-only-long-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("button", { name: "Please wait…", exact: true })).toBeDisabled();
    await page.waitForURL("**/account");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL("**/sign-in?message=signedOut");
    await page.getByLabel("Email address", { exact: true }).fill("wrong@example.invalid");
    await page.getByLabel("Password", { exact: true }).fill("test-only-long-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("We couldn’t sign you in");
    await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
    await page.goto("/sign-up");
    await page.getByLabel("Email address", { exact: true }).fill("limited@example.invalid");
    await page.getByLabel("Password", { exact: true }).fill("test-only-long-password");
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("Too many attempts");
    await expect(page.locator("main")).not.toContainText("over_email_send_rate_limit");
  });

  test("validated sign-in, account profile, protected return and logout", async ({ page }) => {
    await signIn(page, "/account/password");
    await page.waitForURL("**/account/password");
    await page.getByRole("link", { name: "Back to your account", exact: true }).click();
    await expect(page.getByRole("heading", { name: "My profile", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Administration access", exact: true })).toHaveCount(0);
    await page.getByLabel("Your name (optional)", { exact: true }).fill("x");
    await page.getByRole("button", { name: "Save details", exact: true }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("Check the highlighted details");
    await expect(page.getByLabel("Your name (optional)", { exact: true })).toHaveValue("x");
    await page.getByLabel("Your name (optional)", { exact: true }).fill("Updated test name");
    await page.getByRole("button", { name: "Save details", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Your details have been saved");
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/\/account$/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/account\?message=accessDenied$/);
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL("**/sign-in?message=signedOut");
    await page.goto("/account");
    await expect(page).toHaveURL(/sign-in\?message=sessionRequired/);
  });

  test("confirmation and password update remain gated by server Auth responses", async ({ page }) => {
    await page.goto("/auth/confirm?token_hash=test-only-expired&type=recovery");
    await expect(page).toHaveURL(/sign-in\?message=invalidLink$/);
    await page.goto("/auth/confirm?token_hash=test-only-valid&type=recovery");
    await expect(page).toHaveURL(/account\/password$/);
    await page.getByLabel("New password", { exact: true }).fill("test-only-new-password");
    await page.getByLabel("Repeat new password", { exact: true }).fill("different-password");
    await page.getByRole("button", { name: "Save new password", exact: true }).click();
    await expect(page.getByText("The passwords don’t match. Please try again.", { exact: true })).toBeVisible();
    await page.getByLabel("Repeat new password", { exact: true }).fill("test-only-new-password");
    await page.getByRole("button", { name: "Save new password", exact: true }).click();
    await expect(page).toHaveURL(/sign-in\?message=passwordChanged$/);
    await expect(page.getByRole("status")).toContainText("Your password has been changed");
  });
});

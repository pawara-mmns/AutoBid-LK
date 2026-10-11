// Explicit isolated rendered QA. Auth/profile transport is simulated; public SQL/RLS is real.
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "playwright/test";
import { startAuthFixture } from "./auth-fixture.mjs";

const before = process.argv.includes("--before");
const directory = "docs/design/stage-4-2026-10-11";
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run through npm run qa:auth.");
const run = (args, env = process.env) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [npmCli, ...args], { env, stdio: "inherit", windowsHide: true });
  child.on("error", reject);
  child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`Command failed: ${code}`)));
});
await mkdir(`${directory}/screenshots`, { recursive: true });
const fixture = await startAuthFixture();
const env = { ...process.env, NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3105", NEXT_PUBLIC_SUPABASE_URL: fixture.url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_autobid_fixture_only" };
let server, browser;
const observations = [], errors = [];
const startServer = async (configuration) => {
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3105"], { env: configuration, stdio: "pipe", windowsHide: true });
  child.stderr.on("data", (data) => process.stderr.write(data));
  server = child;
  for (let attempt = 0; attempt < 80; attempt++) {
    try { if ((await fetch("http://127.0.0.1:3105/help")).ok) return; } catch { /* Starting isolated server. */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("QA server did not start.");
};
const stopServer = async () => {
  if (server && server.exitCode === null) { const stopped = new Promise((resolve) => server.once("exit", resolve)); server.kill(); await stopped; }
};
try {
  await run(["run", "build"], env);
  await startServer(env);
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && /hydration|didn't match|did not match/i.test(message.text())) errors.push(message.text()); });
  const capture = async (name, width) => {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${directory}/screenshots/${before ? "before" : "normal"}-${name}-${width}.png`, fullPage: true });
    const geometry = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth,
      undersized: Array.from(document.querySelectorAll("main input:not([type=hidden]), main button, main a, main summary")).filter((element) => {
        const box = element.getBoundingClientRect(); return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
      }).map((element) => element.id || element.textContent) }));
    observations.push({ name, width, ...geometry });
    if (geometry.overflow || geometry.undersized.length) throw new Error(`Layout failure: ${name}/${width}`);
  };
  for (const width of before ? [360, 1440] : [360, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 800 : 1024 });
    for (const path of ["sign-in", "sign-up", "forgot-password"]) {
      await page.goto(`http://127.0.0.1:3105/${path}`);
      await page.locator("h1").waitFor();
      await capture(path, width);
    }
    await page.goto("http://127.0.0.1:3105/sign-in");
    await page.getByLabel("Email address", { exact: true }).fill("qa@example.invalid");
    await page.getByLabel("Password", { exact: true }).fill("test-only-long-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/account");
    await capture("account", width);
    if (!before) {
      await page.goto("http://127.0.0.1:3105/account/password");
      await page.getByRole("heading", { name: "Choose a new password", exact: true }).waitFor();
      await capture("password", width);
      await page.getByRole("link", { name: "Back to your account", exact: true }).click();
    }
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL("**/sign-in?message=signedOut");
  }
  if (!before) {
    for (const width of [360, 1440]) {
      await page.setViewportSize({ width, height: width === 360 ? 800 : 1024 });
      await page.goto("http://127.0.0.1:3105/sign-up");
      await page.getByLabel("Email address", { exact: true }).fill("bad");
      await page.getByLabel("Password", { exact: true }).fill("short");
      await page.getByRole("button", { name: "Create account", exact: true }).click();
      await page.locator("main").getByRole("alert").waitFor();
      await capture("validation", width);
      await page.getByLabel("Email address", { exact: true }).fill("signup@example.invalid");
      await page.getByLabel("Password", { exact: true }).fill("test-only-long-password");
      await page.getByRole("button", { name: "Create account", exact: true }).click();
      await page.getByRole("heading", { name: "Check your email", exact: true }).waitFor();
      await capture("confirmation-email", width);
      await page.goto("http://127.0.0.1:3105/forgot-password");
      await page.getByLabel("Email address", { exact: true }).fill("unknown@example.invalid");
      await page.getByRole("button", { name: "Send reset link", exact: true }).click();
      await page.getByRole("heading", { name: "Check your email", exact: true }).waitFor();
      await capture("recovery-email", width);
      await page.goto("http://127.0.0.1:3105/sign-in");
      await page.getByLabel("Email address", { exact: true }).fill("wrong@example.invalid");
      await page.getByLabel("Password", { exact: true }).fill("test-only-long-password");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.locator("main").getByRole("alert").waitFor();
      await capture("credentials-error", width);
      await page.goto("http://127.0.0.1:3105/sign-up");
      await page.getByLabel("Email address", { exact: true }).fill("limited@example.invalid");
      await page.getByLabel("Password", { exact: true }).fill("test-only-long-password");
      await page.getByRole("button", { name: "Create account", exact: true }).click();
      await page.locator("main").getByRole("alert").waitFor();
      await capture("rate-limit", width);
      await page.goto("http://127.0.0.1:3105/sign-in");
      await page.getByLabel("Email address", { exact: true }).fill("slow@example.invalid");
      await page.getByLabel("Password", { exact: true }).fill("test-only-long-password");
      const callsBefore = fixture.requests.filter((operation) => operation === "POST /auth/v1/token").length;
      await page.locator("main form").evaluate((form) => { form.requestSubmit(); form.requestSubmit(); });
      await expect(page.getByRole("button", { name: "Please wait…", exact: true })).toBeDisabled();
      await capture("pending", width);
      await page.waitForURL("**/account");
      if (fixture.requests.filter((operation) => operation === "POST /auth/v1/token").length !== callsBefore + 1) throw new Error("Duplicate sign-in request.");
      await page.getByLabel("Your name (optional)", { exact: true }).fill("x");
      await page.getByRole("button", { name: "Save details", exact: true }).click();
      await page.locator("main").getByRole("alert").waitFor();
      await capture("profile-validation", width);
      await page.getByText("For vehicle dealers", { exact: true }).click();
      await capture("dealer-expanded", width);
      await page.goto("http://127.0.0.1:3105/account/password");
      await page.getByLabel("New password", { exact: true }).fill("test-only-new-password");
      await page.getByRole("button", { name: "Show new password", exact: true }).click();
      await capture("password-visible", width);
      await page.getByLabel("Repeat new password", { exact: true }).fill("different-password");
      await page.getByRole("button", { name: "Save new password", exact: true }).click();
      await page.getByText("The passwords don’t match. Please try again.", { exact: true }).waitFor();
      await capture("password-mismatch", width);
      await page.getByLabel("Repeat new password", { exact: true }).fill("test-only-new-password");
      await page.getByRole("button", { name: "Save new password", exact: true }).click();
      await page.waitForURL("**/sign-in?message=passwordChanged");
      await capture("password-saved", width);
      await page.goto("http://127.0.0.1:3105/auth/confirm?token_hash=test-only-expired&type=recovery");
      await page.locator("main").getByRole("alert").waitFor();
      await capture("expired-link", width);
    }
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("http://127.0.0.1:3105/sign-up");
    await page.locator("h1").waitFor();
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    await capture("200-percent-text", 360);
    await page.goto("http://127.0.0.1:3105/sign-up");
    await page.locator("h1").waitFor();
    await page.evaluate(() => {
      document.querySelectorAll("main label, main button").forEach((element) => {
        if (element.textContent.trim()) element.textContent = Array(3).fill(element.textContent).join(" ");
      });
    });
    await capture("long-copy-stress", 360);
    await stopServer();
    const unconfigured = { ...env, NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "" };
    await run(["run", "build"], unconfigured);
    await startServer(unconfigured);
    for (const width of [360, 1440]) {
      await page.setViewportSize({ width, height: width === 360 ? 800 : 1024 });
      for (const path of ["sign-in", "sign-up", "forgot-password"]) {
        await page.goto(`http://127.0.0.1:3105/${path}`);
        await page.locator("main").getByRole("alert").waitFor();
        await expect(page.locator("main button[type=submit]")).toBeDisabled();
        await capture(`unavailable-${path}`, width);
      }
    }
  }
  await writeFile(`${directory}/${before ? "before" : "normal"}-checks.json`, JSON.stringify({ observations, errors, boundary: "Simulated Auth/profile transport; not actual provider acceptance" }, null, 2));
  if (errors.length) throw new Error("Runtime/hydration errors recorded.");
} finally {
  if (browser) await browser.close();
  await stopServer();
  await fixture.close();
  await run(["run", "build"]);
}

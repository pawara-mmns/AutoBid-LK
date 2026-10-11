import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "playwright/test";
import { startAuthFixture } from "./auth-fixture.mjs";
const directory = "docs/design/stage-5-2026-10-11", origin = "http://127.0.0.1:3106", npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run through npm run qa:seller.");
const run = (args, env = process.env) => new Promise((resolve, reject) => { const child = spawn(process.execPath, [npmCli, ...args], { env, stdio: "inherit", windowsHide: true }); child.on("error", reject); child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`Command failed: ${code}`))); });
await mkdir(`${directory}/screenshots`, { recursive: true });
const fixture = await startAuthFixture({ seller: true });
const env = { ...process.env, NEXT_PUBLIC_SITE_URL: origin, NEXT_PUBLIC_SUPABASE_URL: fixture.url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_autobid_fixture_only" };
let server, browser; const observations = [], errors = [];
try {
  await run(["run", "build"], env);
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3106"], { env, stdio: "ignore", windowsHide: true });
  await expect.poll(async () => { try { return (await fetch(origin)).status; } catch { return 0; } }).toBe(200);
  browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL === "chrome" ? "chrome" : undefined, headless: true });
  for (const width of [360, 390, 768, 1280, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: width < 768 ? 800 : 1024 } });
    page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error" && /hydration|did not match|didn't match/i.test(m.text())) errors.push(m.text()); });
    const capture = async (name) => {
      await page.evaluate(() => document.fonts.ready);
      const scroll = await page.evaluate(() => scrollY);
      for (const img of await page.locator('main img:visible').all()) {
        await img.scrollIntoViewIfNeeded();
        await expect.poll(() => img.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
      }
      await page.evaluate((y) => scrollTo(0,y), scroll);
      const geometry = await page.evaluate(() => {
        const controls = [...document.querySelectorAll('main button, main a, main select, main input:not([type="hidden"]), main textarea, main summary')];
        const undersized = controls.filter((e) => {
          if (e.closest('[hidden]')) return false;
          const target = ['radio','checkbox','file'].includes(e.type) ? e.closest('label') : e;
          const b = target?.getBoundingClientRect(); return b && b.width > 0 && b.height > 0 && (b.width < 44 || b.height < 44);
        }).map((e) => e.id || e.getAttribute('aria-label') || e.textContent);
        return { overflow: document.documentElement.scrollWidth > innerWidth, undersized };
      });
      await page.screenshot({ path: `${directory}/screenshots/${name}-${width}.png`, fullPage: true }); observations.push({ name, width, ...geometry }); if (geometry.overflow || geometry.undersized.length) throw new Error(`Layout failure ${name}/${width}`);
    };
    const fill = async (name, value) => page.getByLabel(name, { exact: true }).fill(value);
    const select = async (name, value) => page.getByLabel(name, { exact: true }).selectOption(value);
    const answer = async (name, value) => page.getByRole("group", { name, exact: true }).getByLabel(value, { exact: true }).check();
    const next = async () => page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.goto(`${origin}/sell`); await capture("guest-introduction"); await page.goto(`${origin}/sign-in?next=%2Fseller%2Fvehicles`);
    await fill("Email address", `qa-${width}@example.invalid`); await fill("Password", "test-only-long-password"); await page.getByRole("button", { name: "Sign in", exact: true }).click(); await page.waitForURL("**/seller/vehicles"); await page.getByRole("heading", { name: "My Vehicles", exact: true }).waitFor(); await capture("empty-dashboard");
    await page.getByRole("link", { name: "Sell Another Vehicle", exact: true }).click(); await page.getByRole("button", { name: "Start my listing", exact: true }).click(); await page.getByRole("heading", { name: "What vehicle are you selling?", exact: true }).waitFor();
    await next(); await capture("vehicle-validation");
    await fill("Brand", "Toyota"); await fill("Model", "Aqua"); await fill("Manufacture year", "2015"); await answer("Registered in Sri Lanka?", "Yes"); await fill("Registration year", "2016"); await select("Fuel type", "hybrid"); await select("Transmission type", "automatic"); await fill("Mileage in kilometres", "100000"); await capture("step-1");
    if (width === 360) { await fill("Model", "Other"); await fill("Type another model", "Unlisted trim"); await capture("other-model"); await fill("Model", "Aqua"); }
    await next();
    await select("District", "Colombo"); await fill("Town / City", "Nugegoda"); await select("Overall condition", "some_repairs"); await answer("Known accident history", "No"); await answer("Known flood damage", "Yes"); await fill("Tell us about the flood damage", "Water reached the carpet; repaired."); await answer("Known mechanical issues", "Yes"); await fill("What needs repair?", "Air conditioning needs repair."); await answer("Outstanding lease or finance", "Not sure"); await capture("step-2"); await next();
    await capture("step-3-empty");
    for (const slot of ["Front of vehicle", "Back of vehicle", "Interior", "Dashboard / mileage"]) { await page.getByLabel(`Choose from Gallery: ${slot}`, { exact: true }).setInputFiles("tests/fixtures/vehicle-photo.png"); await expect(page.locator('main [role=status]').filter({ hasText: /Uploading|Checking and saving/ })).toHaveCount(0); await expect(page.locator("main img")).toHaveCount(["Front of vehicle", "Back of vehicle", "Interior", "Dashboard / mileage"].indexOf(slot)+1); }
    await capture("step-3-photos"); await next();
    await fill("Expected selling price (LKR)", "3,000,000.25"); await fill("Lowest acceptable selling price (LKR)", "2900000"); await fill("Buy Now price (optional)", "3500000"); await capture("step-4"); await next();
    await fill("Contact phone number", "0771234567"); await answer("Are you the registered owner?", "Yes"); await page.getByLabel("I agree to the listing terms below", { exact: true }).check(); await page.getByLabel("I confirm that these details are accurate to the best of my knowledge", { exact: true }).check(); await capture("step-5");
    await page.getByRole("button", { name: "Submit for Review", exact: true }).click(); await page.getByRole("heading", { name: "Submitted for Review", exact: true }).waitFor(); await capture("submitted");
    await page.getByRole("link", { name: "View My Vehicles", exact: true }).click(); await page.getByRole("heading", { name: "My Vehicles", exact: true }).waitFor(); await capture("dashboard"); await page.getByRole("link", { name: "View submission", exact: true }).click(); await page.getByText("This submission is locked while it awaits review. You can view the details below.", { exact: true }).waitFor(); await capture("locked-submission");
    if (width === 360) { await page.evaluate(() => document.documentElement.style.fontSize = "200%"); await capture("text-200-percent"); await page.evaluate(() => document.documentElement.style.fontSize = ""); await page.getByRole("link", { name: "My Vehicles", exact: true }).focus(); await capture("keyboard-focus");
      await page.evaluate(() => { for (const label of document.querySelectorAll('main dt')) { const span = document.createElement('span'); span.lang = 'si'; span.textContent = ' සිංහල'; label.append(span); const tamil = document.createElement('span'); tamil.lang = 'ta'; tamil.textContent = ' தமிழ் — longer label for layout testing'; label.append(tamil); } }); await capture("script-long-copy-stress");
    }
    await page.close();
  }
  if (errors.length) throw new Error(`Runtime errors: ${errors.join('; ')}`);
} finally {
  await writeFile(`${directory}/checks.json`, JSON.stringify({ observations, errors, boundary: "Actual migrated PostgreSQL/RLS; simulated Auth/PostgREST/Storage transport. Not hosted-provider acceptance." }, null, 2));
  await browser?.close(); if (server) { server.kill(); await new Promise((resolve) => server.once("exit", resolve)); } await fixture.close(); await run(["run", "build"]);
}

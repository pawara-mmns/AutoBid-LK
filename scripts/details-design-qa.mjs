// Isolated visual QA only: synthetic PostgreSQL listings, never a real project.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { startMarketplaceFixture } from "./marketplace-fixture.mjs";

const before = process.argv.includes("--before");
const directory = "docs/design/stage-3-2026-10-11";
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run with npm run qa:details.");
const run = (args, env = process.env) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [npmCli, ...args], { env, stdio: "inherit", windowsHide: true });
  child.on("error", reject);
  child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`Command failed: ${code}`)));
});
await mkdir(`${directory}/screenshots`, { recursive: true });
const fixture = await startMarketplaceFixture();
let mode = "normal";
const proxy = createServer(async (request, response) => {
  try {
    if (mode === "error") { response.writeHead(503, { "Content-Type": "application/json" }); response.end('{"message":"Controlled test outage"}'); return; }
    if (mode === "related-loading" && request.url.includes("make=ilike.")) await new Promise((resolve) => setTimeout(resolve, 2500));
    if (mode === "no-related" && request.url.includes("make=ilike.")) {
      response.writeHead(200, { "Content-Type": "application/json", "Content-Range": "0-0/0" }); response.end("[]"); return;
    }
    const upstream = await fetch(`${fixture.url}${request.url}`, { headers: { apikey: "sb_publishable_autobid_fixture_only" } });
    response.writeHead(upstream.status, { "Content-Type": upstream.headers.get("content-type") ?? "application/json", ...(upstream.headers.has("content-range") ? { "Content-Range": upstream.headers.get("content-range") } : {}) });
    if (mode === "single-photo" && request.url.includes("/vehicle_media")) response.end(JSON.stringify((await upstream.json()).slice(0, 1)));
    else response.end(Buffer.from(await upstream.arrayBuffer()));
  } catch { response.writeHead(500); response.end(); }
});
await new Promise((resolve) => proxy.listen(0, "127.0.0.1", resolve));
const env = { ...process.env, NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3104", NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${proxy.address().port}`, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_autobid_fixture_only" };
let server, browser;
try {
  await run(["run", "build"], env);
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3104"], { env, stdio: "pipe", windowsHide: true });
  server.stderr.on("data", (data) => process.stderr.write(data));
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    try { if ((await fetch("http://127.0.0.1:3104/help")).ok) { ready = true; break; } } catch { /* This QA server is starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error("Temporary QA server did not start.");
  browser = await chromium.launch({ channel: "chrome", headless: true });
  let page = await browser.newPage();
  const errors = [], observations = [];
  const watchErrors = (surface) => {
    surface.on("pageerror", (error) => errors.push(error.message));
    surface.on("console", (message) => { if (message.type() === "error" && /hydration|didn't match|did not match/i.test(message.text())) errors.push(message.text()); });
  };
  watchErrors(page);
  for (const width of before ? [360, 1440] : [360, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 800 : 1024 });
    await page.goto("http://127.0.0.1:3104/vehicles/fixture-car-1");
    await page.locator("h1").waitFor();
    await page.locator("main img").first().evaluate((image) => image.decode());
    await page.evaluate(() => document.fonts.ready);
    if (!before) await page.getByRole("heading", { name: "More from this brand", exact: true }).waitFor();
    const prefix = before ? "before" : "normal";
    await page.screenshot({ path: `${directory}/screenshots/${prefix}-details-${width}.png`, fullPage: true });
    await page.screenshot({ path: `${directory}/screenshots/${prefix}-details-${width}-viewport.png` });
    if (!before) {
      const open = page.getByRole("button", { name: "View Toyota Aqua photos full screen", exact: true });
      await open.click();
      const dialog = page.getByRole("dialog");
      await dialog.locator("img").evaluate((image) => image.decode());
      await page.screenshot({ path: `${directory}/screenshots/fullscreen-${width}.png` });
      if (await dialog.evaluate((element) => element.scrollWidth > element.clientWidth)) throw new Error(`Viewer overflow at ${width}`);
      await page.keyboard.press("Escape");
      if (!await open.evaluate((element) => element === document.activeElement)) throw new Error("Viewer focus did not return.");
      await page.getByRole("region", { name: "Seller-declared condition", exact: true }).screenshot({ path: `${directory}/screenshots/condition-${width}.png` });
      await page.getByRole("region", { name: "Vehicle specifications", exact: true }).screenshot({ path: `${directory}/screenshots/specifications-${width}.png` });
    }
    const observation = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      undersized: Array.from(document.querySelectorAll("main button")).filter((element) => {
        const box = element.getBoundingClientRect(); return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
      }).map((element) => element.getAttribute("aria-label") || element.textContent),
    }));
    observations.push({ width, ...observation });
    if (!before && (observation.overflow || observation.undersized.length)) throw new Error(`Layout/target failure at ${width}`);
  }
  if (!before) {
    for (const width of [360, 1440]) {
      await page.setViewportSize({ width, height: width === 360 ? 800 : 1024 });
      for (const state of ["missing-photo", "single-photo", "no-related", "error", "not-found", "related-loading", "image-loading", "image-error"]) {
        // Isolate each transport state from decoded images in previous browser contexts.
        await page.close();
        page = await browser.newPage({ viewport: { width, height: width === 360 ? 800 : 1024 } });
        watchErrors(page);
        mode = state;
        const slug = state === "missing-photo" ? "fixture-car-2" : state === "not-found" ? "hidden-fixture-1" : "fixture-car-1";
        if (state === "image-loading") await page.route("**/_next/image**", async (route) => { await new Promise((resolve) => setTimeout(resolve, 1800)); await route.continue(); });
        if (state === "image-error") await page.route("**/_next/image**", (route) => route.abort());
        const response = await page.goto(`http://127.0.0.1:3104/vehicles/${slug}`, { waitUntil: "commit" });
        await page.locator("h1").waitFor();
        if (state === "image-loading") await page.getByText("Loading photo…", { exact: true }).first().waitFor();
        if (state === "image-error") await page.getByRole("region", { name: "Vehicle photos", exact: true }).getByText("Photo not available").first().waitFor();
        if (state === "related-loading") await page.getByRole("status").filter({ hasText: "Finding related vehicles…" }).waitFor();
        if (state === "no-related") {
          await page.waitForLoadState("load");
          if (await page.getByRole("heading", { name: "More from this brand" }).count()) throw new Error("Empty related section appeared.");
        }
        if (state === "single-photo") {
          await page.getByRole("status").filter({ hasText: "Photo 1 of 1" }).waitFor();
          if (await page.getByRole("button", { name: "Next photo", exact: true }).count()) throw new Error("Single photo has unnecessary navigation.");
        }
        if (state === "not-found" && response.status() !== 404) throw new Error("Hidden detail did not return 404.");
        await page.screenshot({ path: `${directory}/screenshots/${state}-${width}.png` });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        if (overflow) throw new Error(`State overflow: ${width}/${state}`);
        observations.push({ width, state, overflow });
        await page.waitForLoadState("load");
        // Wait for delayed lazy-image handlers before removing interception.
        await page.unrouteAll({ behavior: "wait" });
      }
    }
    mode = "normal";
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("http://127.0.0.1:3104/vehicles/fixture-car-1");
    await page.locator("h1").waitFor();
    await page.getByRole("heading", { name: "More from this brand", exact: true }).waitFor();
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    await page.screenshot({ path: `${directory}/screenshots/text-scale-360.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    observations.push({ width: 360, state: "200%-text", overflow });
    if (overflow) throw new Error("Enlarged text overflows.");
  }
  await writeFile(`${directory}/${before ? "before" : "normal"}-checks.json`, JSON.stringify({ observations, errors }, null, 2));
  if (errors.length) throw new Error("Runtime errors recorded.");
} finally {
  if (browser) await browser.close();
  if (server && server.exitCode === null) { const stopped = new Promise((resolve) => server.once("exit", resolve)); server.kill(); await stopped; }
  await new Promise((resolve) => proxy.close(resolve));
  await fixture.close();
  await run(["run", "build"]);
}

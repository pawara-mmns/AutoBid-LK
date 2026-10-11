// Test-only visual state harness. Uses isolated SQL fixtures, never project data.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { startMarketplaceFixture } from "./marketplace-fixture.mjs";

const directory = "docs/design/stage-2-2026-10-11";
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run with npm run qa:browse.");
const run = (args, env = process.env) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [npmCli, ...args], { env, stdio: "inherit", windowsHide: true });
  child.on("error", reject);
  child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`Command failed: ${code}`)));
});
await mkdir(`${directory}/screenshots`, { recursive: true });
const fixture = await startMarketplaceFixture();
let mode = "populated";
const proxy = createServer(async (request, response) => {
  try {
    if (mode === "loading") await new Promise((resolve) => setTimeout(resolve, 2500));
    if (mode === "error") { response.writeHead(503, { "Content-Type": "application/json" }); response.end('{"message":"Controlled test outage"}'); return; }
    if (mode === "empty") {
      response.writeHead(200, { "Content-Type": "application/json", "Content-Range": "0-0/0" });
      response.end(request.url.includes("rpc/") ? '{"makes":[],"models":[]}' : "[]"); return;
    }
    const upstream = await fetch(`${fixture.url}${request.url}`, { headers: { apikey: "sb_publishable_autobid_fixture_only" } });
    response.writeHead(upstream.status, { "Content-Type": upstream.headers.get("content-type") ?? "application/json", ...(upstream.headers.has("content-range") ? { "Content-Range": upstream.headers.get("content-range") } : {}) });
    response.end(Buffer.from(await upstream.arrayBuffer()));
  } catch { response.writeHead(500); response.end(); }
});
await new Promise((resolve) => proxy.listen(0, "127.0.0.1", resolve));
const env = { ...process.env, NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3103", NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${proxy.address().port}`, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_autobid_fixture_only" };
let server, browser;
const observations = [];
try {
  await run(["run", "build"], env);
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3103"], { env, stdio: "pipe", windowsHide: true });
  server.stderr.on("data", (data) => process.stderr.write(data));
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    try { if ((await fetch("http://127.0.0.1:3103/help")).ok) { ready = true; break; } } catch { /* Wait for this temporary server only. */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error("Temporary QA server did not start.");
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [360, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 800 : 1024 });
    await page.goto("http://127.0.0.1:3103/vehicles");
    await page.locator("main article").first().waitFor();
    await page.locator("main article img").first().evaluate((image) => image.decode());
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${directory}/screenshots/fixture-browse-${width}-viewport.png` });
    await page.locator("main article").first().screenshot({ path: `${directory}/screenshots/card-${width}.png` });
  }
  for (const width of [360, 1440]) {
    await page.setViewportSize({ width, height: width === 360 ? 800 : 1024 });
    for (const state of ["populated", "empty", "error", "loading", "no-results", "filtered"]) {
      mode = state;
      const path = state === "no-results" ? "/vehicles?q=NoSuchCar" : state === "filtered" ? "/vehicles?make=Toyota&model=Aqua&district=Colombo&maxPrice=2000000&fuel=hybrid" : "/vehicles";
      await page.goto(`http://127.0.0.1:3103${path}`, { waitUntil: "commit" });
      if (state === "loading") {
        await page.getByRole("status").filter({ hasText: "Loading vehicles…" }).waitFor();
        await page.screenshot({ path: `${directory}/screenshots/loading-browse-${width}.png` });
        await page.locator("h1").waitFor();
      } else {
        await page.locator("h1").waitFor();
        if (state === "populated" || state === "filtered") await page.locator("main article img").first().evaluate((image) => image.decode());
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: `${directory}/screenshots/${state}-browse-${width}.png`, fullPage: true });
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      if (overflow) throw new Error(`Horizontal overflow at ${width}/${state}`);
      observations.push({ width, state, cards: await page.locator("main article").count(), overflow });
    }
  }
  await page.setViewportSize({ width: 360, height: 800 });
  mode = "populated";
  await page.goto("http://127.0.0.1:3103/vehicles");
  await page.locator("main article").first().waitFor();
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  await page.screenshot({ path: `${directory}/screenshots/text-scale-browse-360.png`, fullPage: true });
  const enlargedOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (enlargedOverflow) throw new Error("Enlarged text overflows at 360px.");
  await writeFile(`${directory}/state-checks.json`, JSON.stringify({ observations, enlargedOverflow, errors }, null, 2));
  if (errors.length) throw new Error("Browser runtime errors recorded.");
} finally {
  if (browser) await browser.close();
  if (server && server.exitCode === null) {
    const stopped = new Promise((resolve) => server.once("exit", resolve));
    server.kill(); await stopped;
  }
  await new Promise((resolve) => proxy.close(resolve));
  await fixture.close();
  await run(["run", "build"]);
}

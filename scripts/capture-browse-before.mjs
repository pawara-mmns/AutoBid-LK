import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const directory = "docs/design/stage-2-2026-10-11/screenshots";
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  for (const width of [360, 1440]) {
    await page.setViewportSize({ width, height: width === 360 ? 800 : 1024 });
    await page.goto("http://localhost:3000/vehicles");
    await page.locator("h1").waitFor();
    await page.screenshot({ path: `${directory}/before-browse-${width}.png`, fullPage: true });
    console.log({ width, heading: await page.locator("h1").textContent() });
  }
} finally { await browser.close(); }

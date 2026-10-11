import { defineConfig, devices } from "@playwright/test";

const developmentServer = process.env.E2E_DEV_SERVER === "1";
const baseURL = developmentServer ? "http://localhost:3000" : "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    channel: process.env.PLAYWRIGHT_CHANNEL === "chrome" ? "chrome" : undefined,
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 800 } } },
  ],
  webServer: {
    command: developmentServer
      ? "npm run dev -- --hostname 127.0.0.1 --port 3000"
      : "npm run start -- --hostname 127.0.0.1 --port 3100",
    url: baseURL,
    reuseExistingServer: developmentServer && !process.env.CI,
    timeout: 60_000,
  },
});

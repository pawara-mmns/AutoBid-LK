import { spawn } from "node:child_process";

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run this script through npm run test:e2e.");

const env = {
  ...process.env,
  NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100",
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
  E2E_AUTH_UNCONFIGURED: "1",
  E2E_DEV_SERVER: "",
};

async function run(args, childEnv = env) {
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [npmCli, ...args], { env: childEnv, stdio: "inherit", windowsHide: true });
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
  if (code !== 0) throw new Error(`Verification command failed with exit code ${code}`);
}

// Public NEXT_PUBLIC_* values are fixed at build time. Restore the normal build
// even after a failure so the ephemeral fixture URL never remains in .next.
try {
  if (!process.argv.includes("--auth-only")) {
    await run(["run", "build"]);
    await run(["exec", "--", "playwright", "test"]);
    const { startMarketplaceFixture } = await import("./marketplace-fixture.mjs");
    const fixture = await startMarketplaceFixture();
    try {
      const fixtureEnv = { ...env, NEXT_PUBLIC_SUPABASE_URL: fixture.url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_autobid_fixture_only", E2E_AUTH_UNCONFIGURED: "", E2E_MARKETPLACE_FIXTURE: "1" };
      process.stdout.write("Testing isolated fixture listings; these are not real marketplace data.\n");
      await run(["run", "build"], fixtureEnv);
      await run(["exec", "--", "playwright", "test"], fixtureEnv);
    } finally { await fixture.close(); }
  }
  const { startAuthFixture } = await import("./auth-fixture.mjs");
  const authFixture = await startAuthFixture();
  try {
    const authEnv = { ...env, NEXT_PUBLIC_SUPABASE_URL: authFixture.url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_autobid_fixture_only", E2E_AUTH_UNCONFIGURED: "", E2E_AUTH_FIXTURE: "1" };
    process.stdout.write("Testing controlled Auth/profile UI transport; not actual GoTrue/SMTP acceptance.\n");
    await run(["run", "build"], authEnv);
    await run(["exec", "--", "playwright", "test", "tests/e2e/auth-experience.spec.ts"], authEnv);
  } finally { await authFixture.close(); }
} finally { await run(["run", "build"], process.env); }

import { spawn } from "node:child_process";
import { startAuthFixture } from "./auth-fixture.mjs";
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run through npm run test:e2e:seller.");
const run = (args, env) => new Promise((resolve, reject) => { const child = spawn(process.execPath, [npmCli, ...args], { env, stdio: "inherit", windowsHide: true }); child.on("error", reject); child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`Command failed: ${code}`))); });
const fixture = await startAuthFixture({ seller: true });
const env = { ...process.env, NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100", NEXT_PUBLIC_SUPABASE_URL: fixture.url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_autobid_fixture_only", E2E_SELLER_FIXTURE: "1", E2E_DEV_SERVER: "" };
try { await run(["run", "build"], env); await run(["exec", "--", "playwright", "test", "tests/e2e/seller-experience.spec.ts", "--workers=1"], env); }
finally { await fixture.close(); await run(["run", "build"], process.env); }

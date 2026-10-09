# AutoBid LK

A Sri Lanka-first vehicle auction and buying marketplace, built incrementally. **Phase 0 is the only implemented phase:** a responsive starter shell, localized-copy foundation and development tooling. The marketplace is not open. There is no authentication, vehicle data, bidding, listing form, admin workflow or payment integration.

## Local setup

Use Node.js 24 LTS (see `.nvmrc`) and npm. Supported runtime range: Node 22.14 through 24. The lockfile pins dependency resolution; use `npm ci` for repeatable installs.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. On Windows PowerShell with restricted script execution, use `npm.cmd` instead of `npm`; changing the machine execution policy is unnecessary.

No credentials are needed in Phase 0. Optionally copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SITE_URL` to your HTTP(S) origin. Invalid values fail with a sanitized message. Never add passwords to URLs. `.env.local` is ignored by Git. Variables prefixed `NEXT_PUBLIC_` are included in browser-accessible configuration; elevated secrets must never use that prefix. The commented Supabase names reserve Phase 1 configuration only and are not consumed yet.

## Verification

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run check` runs lint, type checking and Vitest. Type checking generates Next.js route types first. Playwright starts a production server at 127.0.0.1:3000 and checks desktop/mobile behavior; stop any server using that port before running it. Run `npm run build` before E2E. Reports and generated artifacts are ignored. Use `npm run test:watch` for unit-test development.

If the Playwright browser download is unavailable and Google Chrome is installed, use `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e` (PowerShell: `$env:PLAYWRIGHT_CHANNEL='chrome'; npm.cmd run test:e2e`). This launches a fresh isolated browser context, not your personal browser profile.

For a production startup locally:

```sh
npm run build
npm run start
```

## Structure and conventions

- `src/app/`: App Router pages, root layout, error and missing-page states, global design tokens.
- `src/components/ui/`: small, source-owned shadcn/ui primitives.
- `src/components/layout/`: shared responsive shell.
- `src/i18n/`: typed copy, locale availability and Sri Lanka market defaults.
- `src/lib/`: environment allowlist and shared class-name utility.
- `tests/`: Vitest unit and Playwright E2E tests.
- `docs/`: product, architecture, roadmap, decisions, database status and phase evidence.

Future feature modules, Supabase clients, generated database types and migrations are documented in [Architecture](docs/ARCHITECTURE.md); their folders are created with their first implementation. English is currently rendered, including the HTML language attribute. Sinhala/Tamil dictionaries, locale routing and the language selector are future work, not simulated translations.

## Deployment guidance

The target host is Vercel with the Next.js preset, `npm ci`, `npm run build` and Node 24. Configure the public site origin in the target environment before building; Next.js public variables are fixed at build time. No deployment has been performed. The foundation sets `noindex, nofollow`; remove that only during approved release readiness. Preview deployment is not a production launch; finish the security, accessibility, localization and operational gates in Phase 8 first.

## Project documents

Start with [AGENTS.md](AGENTS.md), [Product requirements](docs/PRODUCT_REQUIREMENTS.md), [Roadmap](docs/ROADMAP.md) and [Phase log](docs/PHASE_LOG.md). See [Decisions](docs/DECISIONS.md) and [Database](docs/DATABASE.md) for constraints on future work.

The phase log records upstream lint-tool dependency advisories and this environment's Git ownership issue. If Git reports dubious ownership for this workspace, `git -c safe.directory=D:/Project/AutoBid-LK status` provides a one-command scoped inspection; have an authorized administrator correct ownership for regular Git use. No global Git trust setting was changed.

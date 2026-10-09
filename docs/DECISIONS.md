# Architecture decisions

## 2026-10-09 — Phase 0

1. **Feature-based modular monolith.** Next.js owns routing/rendering; domain services/schemas will live in feature modules. Add folders when used so the foundation does not imply absent features exist.
2. **npm with exact direct versions and a lockfile.** Stable registry releases are selected; Next.js and eslint-config-next match at 16.4.0, React/React DOM at 19.3.0. TypeScript 5.9.3 is a conservative compatible compiler rather than adopting a new major solely for recency. Node 24 is the local/default runtime.
3. **Tailwind 4 CSS-first configuration.** Use the official PostCSS integration; semantic CSS variables are the design token source. ESLint uses a flat config and the standalone CLI because Next.js 16 build does not run lint.
4. **Source-owned shadcn/ui Radix Button.** Use Slot composition, CVA variants and class merging; keep only the currently needed variants. Adapt to touch sizing and translated-label wrapping. No component gallery, theme switcher or unused primitives.
5. **Server rendering and system fonts.** The static foundation does not need a client application or external image/font dependencies. Future features introduce interactivity where needed; no premature React Compiler configuration.
6. **English now, structured localization immediately.** Centralize copy and metadata; reserve en/si/ta and distinguish supported from available languages. No inert language picker or simulated translations. Full localization/routing arrives in Phase 7.
7. **Configuration without credentials.** Allowlist/validate the optional public site origin with Zod and sanitize failures. Phase 0 starts without env files. Supabase clients/dependencies/schema and generated types arrive in Phase 1; no elevated keys are configured.
8. **Money uses integer minor units.** Future LKR records use cents (100 cents per rupee) with PostgreSQL bigint and precision-safe boundaries. Choose representation/conversion during the database phase before writing any financial code. No money calculations exist yet.
9. **Honest pre-launch shell.** In-page links explain the planned experience. No fake auctions/stats/verification claims, account controls, subscription form or placeholder workflows. Search engines receive noindex until release readiness.
10. **Verification tooling established early.** Vitest checks environment failure/sanitization/allowlisting. Playwright checks the production shell on desktop/mobile plus keyboard and 404 recovery. Further domain tests must verify real security/behavior rather than mirror implementation.
11. **Compatible lint tooling despite upstream maintenance limitations.** ESLint 9.39.5 satisfies the React/import/accessibility plugins bundled with eslint-config-next; ESLint 10 currently conflicts with their peer ranges. npm marks ESLint 9 deprecated. The lint-only `braces` dependency has an unpatched nested-pattern denial-of-service advisory (GHSA-vfj7-8cjw-p6xm), reported across five transitive packages. Do not force a framework downgrade or hide the finding with an unverified override. Reassess upstream releases in Phase 1; production dependencies are unaffected according to npm audit.
12. **Stable project instructions.** Next.js 16.4 automatically appends framework agent rules on development startup. Set its documented `agentRules` option to false so the manually maintained AGENTS.md remains the source of project rules. Version-matched Next.js documentation also ships under node_modules/next/dist/docs/.

## Official setup references consulted

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js ESLint](https://nextjs.org/docs/app/api-reference/config/eslint)
- [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables)
- [Tailwind Next.js integration](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
- [shadcn/ui manual setup](https://ui.shadcn.com/docs/installation/manual) and [Radix Button](https://ui.shadcn.com/docs/components/radix/button)

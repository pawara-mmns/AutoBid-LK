# AutoBid LK development rules

## Phase discipline
- Read this file, README.md, docs/PHASE_LOG.md, docs/ROADMAP.md and relevant architecture/decisions before editing.
- Inspect Git status and existing code. Preserve unrelated work.
- Identify the explicitly authorized phase, give a concise plan, implement only that phase, verify, update relevant documentation and stop.
- Phase 2 is the current authorized scope. Do not begin Phase 3 without a new instruction.
- Do not commit, push, deploy, change a live database or run destructive commands without authorization.
- Report checks actually executed, their results and blockers. Never present placeholders as working features.

## Architecture and stack
- Next.js App Router, strict TypeScript, Tailwind, shadcn/ui patterns and Lucide. Use npm and the checked-in lockfile.
- Feature-based modular monolith. Routes stay thin; domain services and Zod schemas live in src/features/<feature>/.
- Server Components for read-only pages; Client Components only for interaction.
- Shared primitives: src/components/ui/. Shell: src/components/layout/. Shared utilities: src/lib/utils/.
- Supabase clients, migration-derived database types and SQL migrations now exist. Add future feature folders/tables only when needed and authorized.
- Persistence uses Supabase PostgreSQL/Auth/Storage, supabase-js and supabase/ssr; Realtime remains future work. Use SQL migrations and generated types. No ORM without explicit approval.
- Check current official documentation for changing APIs. Avoid unnecessary dependencies, generic repositories, classes and circular imports.
- Prefer kebab-case filenames except framework-required names. Keep business logic outside React components.

## Product and UX
- Sri Lanka first, used passenger cars initially, LKR, Asia/Colombo. Future expansion must not widen current scope.
- Mobile first; readable copy, 44px minimum touch targets, essential fields, clear feedback and confirmations for important actions.
- Public browsing needs no account. Authentication and appropriate verification precede binding bids and live listings.
- Application text and metadata belong in typed dictionaries under src/i18n/. Auth emails use language-specific supabase/templates/ files. English is currently available; Sinhala/Tamil are planned. Never offer an untranslated locale.
- Use logical layout utilities where practical, allow translated text to wrap, and preserve keyboard access and reduced-motion preferences.
- Future seller wizard must be: Your Vehicle; Condition & Location; Add Photos; Set Your Price; Review & Submit.
- Guide identity/ownership verification after submission and before publication. Use safe auction defaults.
- Never invent live auctions, verified claims, user data or marketplace statistics.

## Security and future domain rules
- Never commit secrets. Allowlist public environment variables; NEXT_PUBLIC_* values are public. Elevated Supabase keys are server-only.
- Follow official Supabase Next.js SSR pattern; separate browser/server clients, enforce roles and ownership server-side and with least-privilege RLS.
- Proxy refreshes tokens; protected pages and actions validate identity independently with Auth. Never authorize from getSession or user metadata. Admin grants are current database records, not editable profile flags.
- Profile actions derive ownership from the validated account. Dealer requests are pending; verification/admin writes require separately authorized trusted provisioning. No elevated client is configured in the app.
- One account may buy and sell. Supported permissions: guest, buyer, seller, verified dealer and admin; never trust client roles.
- Private documents require private Storage buckets and authorized access. Public approved vehicle photos need controlled publication.
- Public vehicle reads use the cookie-free public client, explicit column projections, bounded validated URL filters and approved/already-published visibility checks. RLS enforces the same boundary. Never add private seller data to the public read model or grant customer publication/upload writes.
- Store money as exact integer minor units (LKR cents), never floating point; respect PostgreSQL bigint/JavaScript precision limits.
- Bids must use atomic PostgreSQL transactions/locking, server time, approved status, eligible bidder, amount/increment checks, self-bid prevention, idempotency and audit records.
- Clients cannot directly modify bid amounts, winners or auction status. Realtime broadcasts committed results; it does not choose winners.
- Add rate limits and secure logging as relevant features are implemented. Do not log private documents, tokens or secrets.
- No unapproved wallet, escrow or sale-proceeds collection. Payment tracking stays separate from processing.

## Verification and documentation
- Run npm run lint, npm run typecheck and npm run build for relevant application changes. Use meaningful Vitest and Playwright checks for behavior/security changes.
- npm run test includes real isolated PostgreSQL RLS tests; npm run db:types:check verifies generated types against migrations. Stand-in Auth fixtures do not validate the actual Supabase Auth service.
- npm run test:e2e runs unconfigured and isolated marketplace-fixture production browser checks on port 3100, then restores the normal build. Fixtures run on loopback with actual PostgreSQL RLS and never populate a real project. Use Playwright Chromium or the documented isolated Chrome fallback; record configured-provider verification gaps honestly.
- Maintain requirements, architecture, roadmap, phase log, decisions, implemented database design and README without contradictory duplication.
- Use practical comments for non-obvious logic only. Stop after the authorized phase.

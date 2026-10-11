# Development roadmap

Phases require explicit authorization. Completion of a phase never authorizes the next. Common completion gate: scoped implementation, relevant lint/types/build/tests, fixes, updated phase evidence and honest blockers. No live deployment/database changes without authorization.

| Phase | Deliverables | Acceptance criteria |
| --- | --- | --- |
| 0 — Project foundation | Next.js App Router, strict TypeScript, Tailwind, ESLint, minimal shadcn/UI shell, starter page, tokens, locale conventions, safe environment example, project docs | Clean install, startup and production build work; lint/type checks pass; responsive keyboard-accessible shell; honest launch status; no marketplace workflows/data; roadmap and rules documented. |
| 1 — Authentication & database | Supabase SSR integration, sessions, profiles and multi-role permissions, base SQL migrations/RLS, protected routes | Browser/server clients separate; real local auth lifecycle and session renewal verified; one person can buy/sell; privilege escalation and cross-user access denied by server/RLS tests; generated DB types match migrations; secrets stay server-only. |
| 2 — Public marketplace | Homepage/catalog, cards, search/filtering, details | Approved public listings browse without login; private/unapproved data stays hidden; filters/pagination validated; LKR/date formatting centralized; mobile loading/empty/error states and accessible details verified against controlled fixtures. |
| 3 — Seller management | Five-step wizard, drafts, validation, uploads, dashboard, submission | Exact prescribed steps; recoverable owned drafts; meaningful validation; file size/type limits and owned upload access enforced; submission persists review state and cannot publish directly; mobile flow verified. |
| 4 — Admin & verification | Review dashboard, identity/ownership checks, listing decisions/reasons, private document access, audits | Admin authorization enforced server/database-side; private documents unavailable to unrelated users; decisions auditable; rejection/correction path clear; publication requires identity/ownership/listing approval; unauthorized access tests pass. |
| 5 — Auction & bidding | Auction lifecycle/configuration, atomic bids, Realtime, anti-sniping, closure/reserve logic | PostgreSQL transaction/locking prevents races; server time, approval, eligibility, increments, self-bid and duplicates enforced; buyers cannot mutate records/winners/status directly; concurrent/duplicate/late bids tested; highest bid/winner consistent; confirmed events only; closure and extension jobs recoverable/auditable. |
| 6 — Purchase workflow | Winner confirmation, buyer/seller tracking, inspection/transfer checklist, disputes, completed records | Access limited to participants/admin; confirmation and status transitions validated; checklist/dispute history durable; payment tracking separate from processing; no unapproved money collection. |
| 7 — Localization & PWA | Full en/si/ta, installable app, mobile optimization, notification experience, accessibility/usability | Reviewed complete translations, locale-specific HTML and formatting; no untranslated selectable locale; installability verified; cache avoids stale bids/private data; permission-driven notifications with fallback; slower-network/affordable-device and keyboard/screen-reader tests documented. |
| 8 — Release readiness | Full E2E/regression, security/RLS audits, bidding load tests, performance/accessibility, deployment/operations review | Critical user journeys and authorization matrix pass; bidding meets defined concurrency targets; restore/migration/monitoring runbooks checked; secret/env review and launch checklist complete; unresolved launch blockers documented; explicit approval precedes production changes. |

## Status

UI Redesign Stages 1 (design system + homepage), 2 (browsing/search/filters/cards) and 3 (vehicle details) are complete within Phase 2. Stage 3 preserves the established identity and public visibility, improves gallery/condition/price presentation and records five-width/state QA in docs/design/stage-3-2026-10-11/implementation.md. Recommended next UI stage is authentication/account experience review, only after a new instruction. Seller/bidding workflows and development Phase 3 remain outside scope.

Phase 0: complete. Phase 1: implementation and isolated checks complete; actual provider acceptance remains pending. Phase 2 was explicitly authorized and its source implementation/isolated verification are complete. Public configuration exists; the latest normal UI shows zero approved listings, superseding the earlier missing-table observation as a public rendering snapshot. Provider acceptance still needs completion; no migration/deployment was performed during this work. See PHASE_LOG.md for the provider gate. Phases 3–8 are not started or authorized. Resolve documented acceptance requirements before launch; Phase 3 requires a new instruction.

| Phase 2 milestone | Implemented and verified scope |
| --- | --- |
| 2.1 Homepage | Search, categories, eligible recent cards, how it works, responsive navigation and functioning information routes. |
| 2.2 Browsing | Database filters/four sorts, count, URL persistence, bounded pagination, desktop panel/mobile drawer and empty/error states. |
| 2.3 Details | Approved visibility/404 gate, gallery, summary/specifications, declared condition/history, honest auction boundary and bounded related cards. |
| 2.4 Database integration | Public-safe listings/media migration, RLS/column grants, private bucket, public client and generated types; real provider application/acceptance pending. |
| 2.5 Tests and optimization | Unit/PostgreSQL RLS checks, isolated production browser suites, 360px/tablet/desktop review, optimized controlled images and normal-build restoration. |

### Phase 2 presentation follow-up — 2026-10-10

The user selected Premium Automotive Minimalism after a screenshot-backed audit and three visual concepts. The follow-up refines the existing shell, homepage, public catalog/details, account-form presentation and seller information page. It preserves public query/Auth/schema contracts and keeps seller submission/bidding unavailable. No Phase 3 feature is authorized by this redesign. Design rationale and evidence are in [implementation.md](design/redesign-2026-10-10/implementation.md), the root design-qa.md and PHASE_LOG.md.

# Stage 6 — Admin Dashboard & Vehicle Verification

Authorized Stage 6 (development Phase 4), following completed Stages 1–5. Git started clean. Inspected instructions, README, phase/roadmap, architecture/decisions/database, actual grants/SSR, private seller SQL, Storage, UI and test harness before edits. No rebuild, live migration, commit, push or deployment. Stop after Stage 6.

## Implemented behavior

- `/admin`: genuine waiting/more-information/approved/recent-rejected counts and oldest waiting submissions; minimal overview/reviews/history navigation.
- `/admin/listings`: validated make/model/year search, status/Colombo-date filters, oldest/newest submission sort, count and 20-row server pagination. Mobile rows remain simple lists. Loading, unavailable, invalid-filter and empty feedback are implemented.
- `/admin/listings/[id]`: private photo navigation/fallback, full supported vehicle/specification/condition/disclosures, expected/minimum/optional Buy Now/duration, account reference/profile name, unverified submitted phone, ownership/accuracy/intake declarations, private evidence originals/intake and manual outcomes/notes. Internal data never joins the public catalog.
- Start Review, Save Evidence Review, Approve Listing, Request Changes and Reject Listing call authenticated protected database operations. Approve/request/reject confirmations explain effects and use native modal focus/keyboard behavior. Missing required outcomes/evidence, self-review, stale revisions and invalid transitions fail closed.
- `/seller/vehicles/[id]/evidence`: post-submission legal name, registration/chassis references and versioned private-review acknowledgement; identity/registration plus conditional authority/finance originals. At most eight 8 MiB records, shared durable upload quota, actual byte checks, immutable object paths and owner/admin access. Stage 5 photo storage is reused.
- My Vehicles/detail show actual statuses, dates, customer-safe reasons, next steps and restricted edit/resubmit. Reopened groups alone are writable; rejected/approved/under-review submissions remain locked. First/latest/resubmitted dates and decision events persist; resubmission requires a fresh review. No notification provider exists, so none is claimed.
- `/admin/history`: append-only events with bounded listing/actor/action/result-status/date filters, reason/internal notes and pagination. Approval stores the evidence outcome snapshot; app admin document reads are audited without contents/identity numbers/storage URLs.

## Lifecycle and publication

`draft -> pending_review -> under_review -> approved | changes_required | rejected`; permitted corrections return `changes_required -> pending_review`. Current admin grants, parent locks, revisions, idempotent request UUIDs and one-transaction event insertion prevent overwrites/partial decisions. Customers cannot submit rejected/approved/under-review rows through direct RPCs. First submission remains intact and server time records later resubmission; correction/decision times remain in events.

Approval is **private manual-review approval**, not publication. The current versioned seller agreement defers fees/auction commitments until explained and agreed, so Stage 6 creates no public projection, public media promotion or auction. Existing separately approved/published catalog rows remain subject to unchanged public policies. A future, separately authorized publication operation must obtain commitments, revalidate content and project public-safe fields only. Manual acceptance does not prove authenticity/legal ownership or a mechanical inspection; submitted phones stay unverified.

## Files and migrations

Created admin routes/layouts/loading/error handlers under `src/app/admin/`, including queue/detail/history and authorized photo/document handlers. Added owner evidence/document routes under `src/app/seller/vehicles/[id]/`. Created focused `src/features/admin/{schema,queries,review-data,actions,admin-navigation,review-queue,review-filters,review-detail,review-controls,private-gallery,review-history}.tsx/ts` and `src/features/verification/{schema,queries,bytes,routes,evidence-list,evidence-portal}.tsx/ts`. Typed copy lives in `admin-en.ts`; seller/common availability copy and `get-dictionary.ts` were updated.

Modified seller query projections, actions, wizard/review/dashboard/photo handler for actual lifecycle/feedback/scoped corrections; Auth redirect allowlist now supports fixed admin/history/detail and owner evidence destinations. Existing SSR clients, Proxy, public DTOs/queries/policies, money helpers, shell/design tokens and five prescribed seller steps are reused. No new dependency or lockfile installation is needed.

Four necessary migrations:

1. `202610110004_admin_foundation.sql`: lifecycle/timestamps/feedback/correction scopes, submitted-only admin reads, queue/count RPCs.
2. `202610110005_private_verification.sql`: private intake/documents/outcomes/events and bucket, owner evidence RPC and atomic current-grant review RPC.
3. `202610110006_seller_corrections.sql`: explicit versioned replacements of save/photo/submit with group restrictions, outcome invalidation and preserved/resubmitted times; editable-photo Storage policies.
4. `202610110007_review_history.sql`: bounded filtered audit reads.

Updated generated `src/types/database.ts`, `package.json` scripts, loopback `auth-fixture.mjs`/`seller-fixture.mjs`; created admin browser helpers/E2E/visual runners and `tests/{integration/admin-review-rls,unit/verification-bytes,e2e/admin-review}.test/spec.ts`. Trusted synthetic admin provisioning exists only in explicitly started loopback test fixtures, never application code. Updated AGENTS, README, requirements, architecture, database, decisions, roadmap and phase evidence. Captures/checks live beside this report.

## Security and privacy review

| Boundary | Implemented control | Verification / operational limit |
| --- | --- | --- |
| Admin identity/escalation | Confirmed non-anonymous Auth `getUser`, current `admin_grants`, independent server checks and RLS; grant locks for mutations; no editable-metadata authority or elevated client | Forged/revoked/self-review/direct-write tests; real provider token/grant revocation acceptance remains pending |
| IDOR/enumeration | UUID validation, ownership/submitted/current-admin checks, exact immutable paths and bounded projections | Cross-account document/photo/database checks; unavailable refs fail closed |
| Private pricing/PII | Separate intake/evidence/outcome/event tables; owner or authorized admin only; no public joins | Public RLS/DTO regressions; private minimum never reaches ordinary buyers |
| Documents/cache | Private bucket, no upsert/public URL, authorized no-store/no-referrer/no-sniff/sandbox routes, unoptimized private images; original readable evidence | Missing/malformed/mismatched/oversized bytes checked; PDF header/trailer validation is not full parsing or malware scanning; PDFs attachment-only |
| Lifecycle/concurrency | Locks, revision equality, request nonce, guarded transitions and atomic event insert | Duplicate/stale competing-admin decisions tested in isolated PostgreSQL; true independent hosted connection races remain acceptance work |
| XSS/errors/logging | React escaping, allowlisted bounded values, no raw error/document/token logging, no active inline PDFs, no filenames in responses | Static/manual review and browser/runtime checks; no full CSP, penetration test or malware certification is claimed |
| Audit | Normal clients cannot mutate/delete events; download events omit raw document IDs/paths/contents, decisions retain actor/state/time/outcomes | App access logging only; authorized direct Storage downloads need provider audit/log retention before release |
| Quotas | Existing durable 60 upload reservations/hour, object/listing limits and bounded request/decoder work | Provider/hosting body-size/rate/slow-mobile acceptance remains pending |

Identity collection is limited to a review purpose: name shown on evidence, registration/chassis references and relevant documents. No additional NIC-number field, unrelated address or public seller identity is added. Internal notes explicitly discourage copying document numbers/content; public explanations must omit private fraud signals. Originals may retain embedded metadata because they remain private evidence, rather than public vehicle derivatives.

Before collecting live identities, approve the reviewed privacy notice/lawful basis, purpose/access rules, retention durations, appeal/correction and data-subject processes, provider/cross-border arrangements, access monitoring and secure device/operator practices against current Sri Lankan PDPA requirements. Do not assert a commencement date from older contradictory notices. Official [DPA information](https://www.dpa.gov.lk/Background.php) and [2025 amendment](https://www.dpa.gov.lk/acts/22-2025_E_251104_201549.pdf) inform that review; this implementation does not claim legal compliance.

Retention/deletion plan: choose justified periods per pending/rejected/approved evidence, minimize raw-doc retention once a legally appropriate review record suffices, support legal holds and an authorized erasure/anonymization workflow, remove private objects before metadata, reconcile incomplete/orphan uploads, and align backups/provider logs with that policy. Audit rows are protected against accidental cascade deletion; account/listing erasure therefore requires a trusted deliberate workflow rather than naive Auth deletion. No arbitrary retention timer or destructive cleanup executes in this stage. Unfinished uploads can remain private if status changes prevent cleanup; the reviewer sees missing evidence and cannot accept it as available. Production orphan reconciliation is a release gate.

Sources for technical boundaries: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [database functions](https://supabase.com/docs/guides/database/functions), [Storage RLS](https://supabase.com/docs/guides/storage/security/access-control), [private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals).

## Validation record

Final unit/database checks passed: lint, 231 Vitest tests across 14 files and migration-derived type consistency. Stage 6 contributes 33 migrated PostgreSQL review/access/lifecycle tests and seven original-evidence byte tests. Production Stage 6 browser checks passed all eight desktop/mobile journeys: unauthorized/forged roles, private photos/documents and no-cache/cross-account denial, evidence outcomes/approval confirmation and Escape/focus restoration, approved-private seller status/history, scoped correction/resubmission and rejection/internal-note privacy, queue empty/invalid-filter feedback. Builds and ordinary-build restoration passed. The documented installed-Chrome fallback was used because bundled Playwright Chromium is absent.

Failures found and fixed: a bounded numeric test assertion, explicit test row types, test adapter ordering for non-`id` primary keys, file chooser/button label ambiguity, framework route-announcer selector ambiguity, evidence outcome accessible labels, unsaved outcome approval gating and superseded correction feedback after approval. No failed check is counted as a pass; successful final reruns replace those intermediate failures.

Visual QA passed 78 captures/observations at 360, 390, 768, 1280 and 1440px. Each width covers evidence intake/uploaded state, overview, queue/empty results, pending/underway/accepted review, all three decision dialogs, seller correction/approval/rejection and history. Additional 360px captures cover keyboard focus, 200% text and Sinhala/Tamil long-label stress. No measured horizontal overflow, undersized inspected controls or runtime/hydration errors remain. Manual review sampled mobile/tablet/desktop overview, queue, review and dialogs. Fixed a real enlarged-text gallery overflow; also corrected visual-runner URL resolution and isolated second-seller sessions. The resulting gallery caption and controls wrap safely. Script stress is layout testing, not a translated interface or full screen-reader/WCAG acceptance.

Existing-flow production regressions passed: 14 seller checks; full runner 25 unconfigured checks with 61 intentional fixture-dependent skips, 48 marketplace-fixture checks with 38 intentional skips, and 14 controlled Auth checks. These cover the five-step wizard/autosave/uploads/dashboard, public browse/detail/privacy/navigation, protected responses, account/confirmation/recovery/profile/logout and keyboard/media interactions. Final explicit TypeScript and lint checks passed; all production builds and ordinary-build restoration passed. The final isolated database rerun passed 101 checks in four files, including explicit anonymous Storage and owner/buyer admin-RPC denial. Historical screenshots regenerated by the regression runner and generated Next references are restored to the clean starting versions.

Actual migrated PostgreSQL executes RLS/constraints/transactions; Auth/PostgREST/object transport remains simulated and loopback-only. No fixture data is in a normal build or real project. See `checks.json` for screen measurements. Work began 2026-10-11; final regression/documentation completed 2026-10-12 Asia/Colombo.

## Release gates and next scope

Supabase CLI is absent and Docker's daemon is unavailable (read-only recheck during Stage 6). No authorized disposable hosted/provider environment was supplied. Review/apply all nine migrations to a separately authorized disposable environment and verify genuine Auth/SMTP/PostgREST/Storage, refreshed/revoked identities/grants, independent concurrent admin transactions, upload/body limits and bucket defaults before release. Do not substitute the stand-in Auth fixture for that acceptance.

Reviewed Sinhala/Tamil translations, real screen-reader/physical-device tests, production performance/rate/access logging, malware handling, retention/erasure and publication commitments remain release work. Only English is offered. No live migration/data change, commit/push/deployment, auctions/bids/winners, messaging system, dealer provisioning, payments, wallet or escrow was added. Recommended next work is separately authorized disposable-provider acceptance and operational/privacy review. Stage 6 stops here; future feature stages require new instruction.

## Complete file inventory

Source, tests, configuration and documentation changed in this stage; 78 synthetic-data screenshots are additionally created under `screenshots/`. No dependency installation or lockfile change.

| File | Change |
| --- | --- |
| `AGENTS.md` | Modified |
| `docs/ARCHITECTURE.md` | Modified |
| `docs/DATABASE.md` | Modified |
| `docs/DECISIONS.md` | Modified |
| `docs/design/stage-6-2026-10-11/checks.json` | Created |
| `docs/design/stage-6-2026-10-11/implementation.md` | Created |
| `docs/PHASE_LOG.md` | Modified |
| `docs/PRODUCT_REQUIREMENTS.md` | Modified |
| `docs/ROADMAP.md` | Modified |
| `package.json` | Modified |
| `README.md` | Modified |
| `scripts/admin-browser-helpers.mjs` | Created |
| `scripts/admin-design-qa.mjs` | Created |
| `scripts/auth-fixture.mjs` | Modified |
| `scripts/run-admin-e2e.mjs` | Created |
| `scripts/seller-fixture.mjs` | Modified |
| `src/app/admin/error.tsx` | Created |
| `src/app/admin/history/page.tsx` | Created |
| `src/app/admin/layout.tsx` | Created |
| `src/app/admin/listings/[id]/documents/[documentId]/route.ts` | Created |
| `src/app/admin/listings/[id]/layout.tsx` | Created |
| `src/app/admin/listings/[id]/loading.tsx` | Created |
| `src/app/admin/listings/[id]/page.tsx` | Created |
| `src/app/admin/listings/[id]/photos/[photoId]/route.ts` | Created |
| `src/app/admin/listings/page.tsx` | Created |
| `src/app/admin/loading.tsx` | Created |
| `src/app/admin/page.tsx` | Modified |
| `src/app/seller/vehicles/[id]/documents/[documentId]/route.ts` | Created |
| `src/app/seller/vehicles/[id]/documents/route.ts` | Created |
| `src/app/seller/vehicles/[id]/evidence/page.tsx` | Created |
| `src/features/admin/actions.ts` | Created |
| `src/features/admin/admin-navigation.tsx` | Created |
| `src/features/admin/private-gallery.tsx` | Created |
| `src/features/admin/queries.ts` | Created |
| `src/features/admin/review-controls.tsx` | Created |
| `src/features/admin/review-data.ts` | Created |
| `src/features/admin/review-detail.tsx` | Created |
| `src/features/admin/review-filters.tsx` | Created |
| `src/features/admin/review-history.tsx` | Created |
| `src/features/admin/review-queue.tsx` | Created |
| `src/features/admin/schema.ts` | Created |
| `src/features/auth/redirects.ts` | Modified |
| `src/features/seller-listings/actions.ts` | Modified |
| `src/features/seller-listings/dashboard.tsx` | Modified |
| `src/features/seller-listings/photo-routes.ts` | Modified |
| `src/features/seller-listings/queries.ts` | Modified |
| `src/features/seller-listings/review-submit-step.tsx` | Modified |
| `src/features/seller-listings/seller-listing-wizard.tsx` | Modified |
| `src/features/verification/bytes.ts` | Created |
| `src/features/verification/evidence-list.tsx` | Created |
| `src/features/verification/evidence-portal.tsx` | Created |
| `src/features/verification/queries.ts` | Created |
| `src/features/verification/routes.ts` | Created |
| `src/features/verification/schema.ts` | Created |
| `src/i18n/dictionaries/admin-en.ts` | Created |
| `src/i18n/dictionaries/en.ts` | Modified |
| `src/i18n/dictionaries/seller-en.ts` | Modified |
| `src/i18n/get-dictionary.ts` | Modified |
| `src/types/database.ts` | Modified |
| `supabase/migrations/202610110004_admin_foundation.sql` | Created |
| `supabase/migrations/202610110005_private_verification.sql` | Created |
| `supabase/migrations/202610110006_seller_corrections.sql` | Created |
| `supabase/migrations/202610110007_review_history.sql` | Created |
| `tests/e2e/admin-review.spec.ts` | Created |
| `tests/integration/admin-review-rls.test.ts` | Created |
| `tests/unit/verification-bytes.test.ts` | Created |

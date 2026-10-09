# Database status

**No database is implemented or connected in Phase 0.** No tables, policies, migrations, Storage buckets, seed users or generated database types exist. No local or live database has been modified.

Phase 1 will introduce Supabase PostgreSQL with version-controlled SQL migrations, generated TypeScript types, Auth-backed profiles, multi-role permissions and least-privilege RLS. Future phases add their own tables/policies incrementally. The specific schema must be reviewed and documented when implemented; this file does not claim planned entities exist.

Carry-forward constraints: ownership and roles enforced server-side and in RLS; private identity/registration documents; exact integer minor-unit money; atomic auditable bidding with locks and duplicate protection; no direct buyer writes to bid amounts, winners or auction status. Realtime delivers committed results. See PRODUCT_REQUIREMENTS.md and ARCHITECTURE.md for the domain requirements.

import { z } from 'zod';
export const documentKinds = ['identity','registration','authority','finance'] as const;
export const evidenceSchema = z.object({ legal_name:z.string().trim().min(2).max(120),registration_number:z.string().trim().min(1).max(30),chassis_number:z.string().trim().min(1).max(40),consent_version:z.literal('private-evidence-2026-10-11') }).strict();
export const outcomes = ['not_reviewed','under_review','accepted','needs_information','rejected'] as const;
export const correctionScopes = ['vehicle','condition','photos','pricing','contact','documents'] as const;

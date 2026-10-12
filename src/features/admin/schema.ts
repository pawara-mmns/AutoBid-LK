import { z } from 'zod';
export const queueStatuses = ['waiting','pending_review','under_review','changes_required','approved','rejected','all'] as const;
export const queueSchema = z.object({ q: z.string().trim().max(80).default(''), status: z.enum(queueStatuses).default('waiting'), from: z.union([z.literal(''),z.iso.date()]).default(''), to: z.union([z.literal(''),z.iso.date()]).default(''), sort: z.enum(['oldest','newest']).default('oldest'), page: z.coerce.number().int().min(1).max(1000).default(1) }).refine((v)=>!v.from||!v.to||v.from<=v.to,{path:['to']});
export type QueueFilters = z.infer<typeof queueSchema>;
export const queueResultSchema = z.object({ count: z.number().int().min(0), rows: z.array(z.object({ id: z.uuid(), owner_id: z.uuid(), make: z.string().nullable(), model: z.string().nullable(), year: z.string().nullable(), status: z.enum(['pending_review','under_review','changes_required','approved','rejected']), seller_name: z.string().nullable(), submitted_at: z.string(), photo_id: z.uuid().nullable() })).max(20) });
export type QueueResult = z.infer<typeof queueResultSchema>;
export function queueLink(filters: QueueFilters, page: number) { const params = new URLSearchParams(); for (const [key,value] of Object.entries({...filters,page})) if (value!=='') params.set(key,String(value)); return `/admin/listings?${params}`; }

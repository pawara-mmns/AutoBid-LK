import 'server-only';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { queueResultSchema, type QueueFilters } from './schema';
export async function reviewQueue(client: SupabaseClient<Database>, filters: QueueFilters) {
  const {data,error}=await client.rpc('admin_review_queue',{p_input:filters}); if(error) return null; const parsed=queueResultSchema.safeParse(data); return parsed.success?parsed.data:null;
}
export async function reviewCounts(client: SupabaseClient<Database>) {
  const {data,error}=await client.rpc('admin_review_counts',{p_input:{}}); if(error)return null;
  const result=z.object({waiting:z.number().int().min(0),changes:z.number().int().min(0),approved:z.number().int().min(0),rejected:z.number().int().min(0)}).safeParse(data); return result.success?result.data:null;
}

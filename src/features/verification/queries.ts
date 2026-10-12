import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
export type VerificationDocument = Database['public']['Tables']['verification_documents']['Row'];
export type VerificationIntake = Database['public']['Tables']['verification_intakes']['Row'];
export async function loadEvidence(client:SupabaseClient<Database>,id:string) {
 const [documents,intake]=await Promise.all([client.from('verification_documents').select('id,listing_id,kind,format,storage_path,uploaded_at,created_at').eq('listing_id',id).order('created_at').limit(8),client.from('verification_intakes').select('listing_id,legal_name,registration_number,chassis_number,consent_version,updated_at').eq('listing_id',id).maybeSingle()]);
 if(documents.error||intake.error) throw new Error('evidence_unavailable');
 return {documents:documents.data,intake:intake.data};
}

'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getValidatedUser,hasAdminGrant } from '@/features/auth/authorization';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { outcomes,correctionScopes } from '@/features/verification/schema';
import { loadSellerPhotos,readSellerPhoto } from '@/features/seller-listings/photos';
import { sellerColumns } from '@/features/seller-listings/queries';
import { loadEvidence } from '@/features/verification/queries';
import { readEvidenceBytes } from '@/features/verification/bytes';
const operationSchema=z.object({listing_id:z.uuid(),revision:z.number().int().min(0),request_id:z.uuid(),action:z.enum(['start','verification','approve','changes','reject']),reason:z.string().trim().max(1000).optional(),scopes:z.array(z.enum(correctionScopes)).max(6).optional(),internal_note:z.string().max(1000).optional(),identity_outcome:z.enum(outcomes).optional(),ownership_outcome:z.enum(outcomes).optional(),finance_outcome:z.enum(outcomes).optional(),attested:z.boolean().optional()}).strict();
export async function reviewOperation(input:unknown) {
 const parsed=operationSchema.safeParse(input); if(!parsed.success)return {ok:false,conflict:false};
 const client=await createServerSupabaseClient(),user=client&&await getValidatedUser(client);
 if(!client||!user||!await hasAdminGrant(client,user.id))return {ok:false,conflict:false};
 try {
  if(parsed.data.action==='approve') {
   const {data:listing,error}=await client.from('seller_listings').select(sellerColumns).eq('id',parsed.data.listing_id).maybeSingle();
   if(error||!listing||!['under_review','approved'].includes(listing.status)||listing.owner_id===user.id)return {ok:false,conflict:false};
   for(const photo of (await loadSellerPhotos(client,listing.id)).filter(p=>p.uploaded_at)) await readSellerPhoto(client,photo,listing.owner_id);
   for(const document of (await loadEvidence(client,listing.id)).documents.filter(d=>d.uploaded_at)) await readEvidenceBytes(client,document,listing.owner_id);
  }
  const {error}=await client.rpc('admin_review_operation',{p_input:parsed.data});
  if(error)return {ok:false,conflict:error.code==='40001'};
  revalidatePath('/admin');revalidatePath('/admin/listings');revalidatePath(`/admin/listings/${parsed.data.listing_id}`);revalidatePath('/seller/vehicles');revalidatePath(`/seller/vehicles/${parsed.data.listing_id}`);
  return {ok:true,conflict:false};
 } catch {return {ok:false,conflict:false};}
}

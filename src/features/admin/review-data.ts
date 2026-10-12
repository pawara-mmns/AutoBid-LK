import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/features/auth/guards';
import { sellerColumns } from '@/features/seller-listings/queries';
import { loadSellerPhotos } from '@/features/seller-listings/photos';
import { loadEvidence } from '@/features/verification/queries';
export const reviewData=cache(async(id:string)=>{
 if(!z.uuid().safeParse(id).success)notFound();
 const {client,user}=await requireAdmin();
 const {data:listing,error}=await client.from('seller_listings').select(sellerColumns).eq('id',id).maybeSingle();
 if(error)throw new Error('review_unavailable');if(!listing||listing.status==='draft')notFound();
 const [photos,evidence,verification,seller]=await Promise.all([loadSellerPhotos(client,id),loadEvidence(client,id),client.from('listing_verifications').select('listing_id,identity_outcome,ownership_outcome,finance_outcome,internal_note,checked_revision,reviewer_id,updated_at').eq('listing_id',id).maybeSingle(),client.from('profiles').select('id,display_name').eq('id',listing.owner_id).maybeSingle()]);
 if(verification.error||seller.error)throw new Error('review_unavailable');
 return {listing,photos,...evidence,verification:verification.data,seller:seller.data,userId:user.id};
});

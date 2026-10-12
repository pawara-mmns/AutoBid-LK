import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getValidatedUser,hasAdminGrant } from '@/features/auth/authorization';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { publicEnv } from '@/lib/env';
import { loadSellerListing,sellerColumns } from '@/features/seller-listings/queries';
import { loadSellerPhotos,readSellerPhoto } from '@/features/seller-listings/photos';
import { readBoundedBody } from '@/features/seller-listings/request-body';
import { maxPhotoBytes } from '@/features/seller-listings/image-validation';
import { loadEvidence } from './queries';
import { documentKinds,evidenceSchema } from './schema';
import { evidenceFormat,validateEvidenceBytes,readEvidenceBytes,evidenceMime } from './bytes';
export const privateHeaders={'Cache-Control':'private, no-store, max-age=0','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"};
const result=(error:string,status=404)=>Response.json({error},{status,headers:privateHeaders});
async function context(id:string,admin=false) {
 if(!z.uuid().safeParse(id).success)return null;
 const client=await createServerSupabaseClient(),user=client&&await getValidatedUser(client);if(!client||!user)return null;
 if(admin&&!await hasAdminGrant(client,user.id))return null;
 const listing=admin?(await client.from('seller_listings').select(sellerColumns).eq('id',id).maybeSingle()).data:await loadSellerListing(client,user.id,id);
 if(!listing||(admin&&listing.status==='draft'))return null;
 return {client,user,listing};
}
export async function privatePhoto(id:string,photoId:string) {
 if(!z.uuid().safeParse(photoId).success)return result('not_available');
 try {const ctx=await context(id,true);if(!ctx)return result('not_available');const photo=(await loadSellerPhotos(ctx.client,id)).find(p=>p.id===photoId&&p.uploaded_at);if(!photo)return result('not_available');const bytes=await readSellerPhoto(ctx.client,photo,ctx.listing.owner_id);return new Response(new Uint8Array(bytes),{headers:{...privateHeaders,'Content-Type':'image/jpeg'}});}catch{return result('not_available');}
}
export async function privateDocument(id:string,documentId:string,admin=false) {
 if(!z.uuid().safeParse(documentId).success)return result('not_available');
 try {const ctx=await context(id,admin);if(!ctx)return result('not_available');const document=(await loadEvidence(ctx.client,id)).documents.find(d=>d.id===documentId&&d.uploaded_at);if(!document||document.storage_path!==`${ctx.listing.owner_id}/${id}/${document.id}.${document.format}`)return result('not_available');
  const bytes=await readEvidenceBytes(ctx.client,document,ctx.listing.owner_id);
  if(admin){const {error:audit}=await ctx.client.rpc('admin_review_operation',{p_input:{listing_id:id,document_id:documentId,request_id:randomUUID(),action:'document_access'}});if(audit)return result('not_available');}
  return new Response(new Uint8Array(bytes),{headers:{...privateHeaders,'Content-Type':evidenceMime(document.format),'Content-Disposition':document.format==='pdf'?`attachment; filename="evidence-${document.id}.pdf"`:'inline'}});
 }catch{return result('not_available');}
}
export async function evidenceMutation(request:Request,id:string) {
 if(request.headers.get('origin')!==new URL(publicEnv.NEXT_PUBLIC_SITE_URL).origin)return result('not_allowed',403);
 try {const ctx=await context(id);if(!ctx)return result('not_available');const {client,user,listing}=ctx;
  if(!(listing.status==='pending_review'||(listing.status==='changes_required'&&Array.isArray(listing.correction_scopes)&&listing.correction_scopes.includes('documents'))))return result('not_editable',403);
  if(request.headers.get('content-type')?.startsWith('multipart/form-data')) {
   const raw=await readBoundedBody(request,maxPhotoBytes+16384),form=await new Request(request.url,{method:'POST',headers:{'Content-Type':request.headers.get('content-type')!},body:raw}).formData(),file=form.get('file'),kind=z.enum(documentKinds).parse(form.get('kind'));
   if(!(file instanceof File)||file.size>maxPhotoBytes)return result('unsupported',400);
   const bytes=Buffer.from(await file.arrayBuffer()),format=evidenceFormat(bytes),pdf=format==='pdf',documentId=randomUUID();
   const {error:reserve}=await client.rpc('seller_verification_evidence',{p_input:{listing_id:id,action:'reserve',document_id:documentId,kind,format}});if(reserve)return result('upload_failed',400);
   const path=`${user.id}/${id}/${documentId}.${format}`;
   let decoded:Buffer;try{decoded=await validateEvidenceBytes(bytes,format);}catch{await client.rpc('seller_verification_evidence',{p_input:{listing_id:id,action:'remove',document_id:documentId}});return result('unsupported',400);}
   const {error:upload}=await client.storage.from('verification-documents').upload(path,decoded,{contentType:pdf?'application/pdf':evidenceMime(format),upsert:false,cacheControl:'0'});
   const {error:complete}=upload?{error:upload}:await client.rpc('seller_verification_evidence',{p_input:{listing_id:id,action:'complete',document_id:documentId}});
   if(complete){await client.storage.from('verification-documents').remove([path]);await client.rpc('seller_verification_evidence',{p_input:{listing_id:id,action:'remove',document_id:documentId}});return result('upload_failed',400);}
  }else {
   const body=JSON.parse((await readBoundedBody(request,2048)).toString('utf8'));
   if(body.action==='details'){const details=evidenceSchema.parse(body.details);const {error}=await client.rpc('seller_verification_evidence',{p_input:{listing_id:id,action:'details',...details}});if(error)return result('upload_failed',400);}
   else{const documentId=z.uuid().parse(body.documentId);if(body.action!=='remove')return result('unsupported',400);const document=(await loadEvidence(client,id)).documents.find(d=>d.id===documentId);if(!document)return result('not_available');const {error:remove}=await client.storage.from('verification-documents').remove([document.storage_path]);if(remove)return result('upload_failed',400);const {error}=await client.rpc('seller_verification_evidence',{p_input:{listing_id:id,action:'remove',document_id:documentId}});if(error)return result('upload_failed',400);}
  }
  return Response.json(await loadEvidence(client,id),{headers:privateHeaders});
 }catch(error){const invalid=error instanceof z.ZodError||error instanceof SyntaxError||(error instanceof Error&&['size_limit','missing_body','unsupported','unsupported_photo'].includes(error.message));return result(invalid?'unsupported':'upload_failed',invalid?400:503);}
}

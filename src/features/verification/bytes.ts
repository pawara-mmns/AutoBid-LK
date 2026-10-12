import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { maxPhotoBytes,optimizeSellerPhoto } from '@/features/seller-listings/image-validation';
import type { VerificationDocument } from './queries';
export function evidenceFormat(bytes:Buffer):'jpg'|'png'|'webp'|'pdf' {
 if(bytes.subarray(0,5).toString('ascii')==='%PDF-')return 'pdf';
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'png';
 if(bytes.subarray(0,4).toString('ascii')==='RIFF'&&bytes.subarray(8,12).toString('ascii')==='WEBP')return 'webp';
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'jpg';
 throw new Error('unsupported');
}
export async function validateEvidenceBytes(bytes:Buffer,format:string) {
 if(bytes.length>maxPhotoBytes||evidenceFormat(bytes)!==format)throw new Error('unsupported');
 if(format==='pdf'){if(bytes.length<=20||!bytes.subarray(-1024).includes(Buffer.from('%%EOF')))throw new Error('unsupported');}
 else await optimizeSellerPhoto(bytes); // Decode for safety; preserve the full readable original evidence.
 return bytes;
}
export async function readEvidenceBytes(client:SupabaseClient<Database>,document:VerificationDocument,owner:string) {
 if(document.storage_path!==`${owner}/${document.listing_id}/${document.id}.${document.format}`)throw new Error('invalid_path');
 const {data,error}=await client.storage.from('verification-documents').download(document.storage_path);
 if(error||!data||data.size>maxPhotoBytes)throw new Error('unavailable');
 return validateEvidenceBytes(Buffer.from(await data.arrayBuffer()),document.format);
}
export const evidenceMime=(format:string)=>format==='pdf'?'application/octet-stream':format==='jpg'?'image/jpeg':`image/${format}`;

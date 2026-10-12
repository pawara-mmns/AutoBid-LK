import { privatePhoto } from '@/features/verification/routes';
export async function GET(_request:Request,{params}:{params:Promise<{id:string;photoId:string}>}){const p=await params;return privatePhoto(p.id,p.photoId);}

import { privateDocument } from '@/features/verification/routes';
export async function GET(_request:Request,{params}:{params:Promise<{id:string;documentId:string}>}){const p=await params;return privateDocument(p.id,p.documentId);}

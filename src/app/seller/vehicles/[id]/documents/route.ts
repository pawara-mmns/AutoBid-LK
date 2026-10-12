import { evidenceMutation } from '@/features/verification/routes';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){return evidenceMutation(request,(await params).id);}

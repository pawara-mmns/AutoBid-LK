import { ReviewHistory } from '@/features/admin/review-history';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <ReviewHistory search={await searchParams}/>;}

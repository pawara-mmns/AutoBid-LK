import { ReviewDetail } from '@/features/admin/review-detail';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}) {return <ReviewDetail id={(await params).id}/>;}

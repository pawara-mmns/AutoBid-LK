import { reviewData } from '@/features/admin/review-data';
export default async function Layout({params,children}:{params:Promise<{id:string}>;children:React.ReactNode}){await reviewData((await params).id);return children;}

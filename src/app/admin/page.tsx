import { requireAdmin } from "@/features/auth/guards";
import Link from 'next/link';
import { getAdminDictionary } from '@/i18n/get-dictionary';
import { reviewCounts,reviewQueue } from '@/features/admin/queries';
import { queueSchema } from '@/features/admin/schema';
import { ReviewQueue } from '@/features/admin/review-queue';
import { AdminNavigation } from '@/features/admin/admin-navigation';
import { Button } from '@/components/ui/button';

export const dynamic = "force-dynamic";
export default async function AdminAccessPage() {
  const {client}=await requireAdmin(); const c=getAdminDictionary(); const filters=queueSchema.parse({});
  const [counts,queue]=await Promise.all([reviewCounts(client),reviewQueue(client,filters)]);
  return <div className="site-container py-8 sm:py-12"><AdminNavigation/><h1 className="text-3xl font-semibold">{c.title}</h1><p className="mt-3 text-muted-foreground">{c.description}</p>{counts?<dl className="my-8 grid grid-cols-2 gap-6 border-y border-border py-6 lg:grid-cols-4">{(Object.keys(c.counts) as (keyof typeof c.counts)[]).map((key)=><div key={key}><dt className="text-ui text-muted-foreground">{c.counts[key]}</dt><dd className="mt-2 text-3xl font-semibold tabular-nums">{counts[key]}</dd></div>)}</dl>:<p role="alert" className="my-8">{c.unavailable}</p>}<div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-section font-semibold">{c.nextAttention}</h2><Button asChild variant="outline"><Link href="/admin/listings">{c.allReviews}</Link></Button></div><ReviewQueue result={queue} filters={filters} compact/></div>;
}

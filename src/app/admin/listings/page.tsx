import { requireAdmin } from '@/features/auth/guards';
import { reviewQueue } from '@/features/admin/queries';
import { queueSchema } from '@/features/admin/schema';
import { ReviewQueue } from '@/features/admin/review-queue';
import { ReviewFilters } from '@/features/admin/review-filters';
import { AdminNavigation } from '@/features/admin/admin-navigation';
import { getAdminDictionary } from '@/i18n/get-dictionary';
export const dynamic='force-dynamic';
export default async function ReviewQueuePage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 const {client}=await requireAdmin(); const parsed=queueSchema.safeParse(await searchParams);const filters=parsed.success?parsed.data:queueSchema.parse({});const c=getAdminDictionary();
 return <div className="site-container py-8 sm:py-12"><AdminNavigation/><h1 className="mb-6 text-3xl font-semibold">{c.queue}</h1>{!parsed.success&&<p role="alert" className="mb-5 text-danger">{c.invalidFilters}</p>}<ReviewFilters filters={filters}/><ReviewQueue result={await reviewQueue(client,filters)} filters={filters}/></div>;
}

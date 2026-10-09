import { requireAdmin } from "@/features/auth/guards";
import { getDictionary } from "@/i18n/get-dictionary";

export const dynamic = "force-dynamic";
export default async function AdminAccessPage() {
  await requireAdmin();
  const copy = getDictionary().account;
  return <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
    <h1 className="text-3xl font-semibold">{copy.adminTitle}</h1>
    <p className="mt-4 text-muted-foreground">{copy.adminDescription}</p>
  </div>;
}

import { randomUUID } from "node:crypto";
import { CreateDraftButton } from "@/features/seller-listings/create-draft-button";
import { requireUser } from "@/features/auth/guards";
import { createDraft } from "@/features/seller-listings/actions";
import { getSellerDictionary } from "@/i18n/get-dictionary";
export const dynamic = "force-dynamic";
export default async function NewListingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireUser("/seller/vehicles/new"); const c = getSellerDictionary(); const { error } = await searchParams;
  return <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8"><h1 className="text-3xl font-semibold">{c.introduction}</h1><p className="mt-4 text-muted-foreground">{c.intro}</p>{error && <p role="alert" className="mt-4 text-danger">{c.createFailed}</p>}<form action={createDraft} className="mt-8"><input type="hidden" name="id" value={randomUUID()} /><CreateDraftButton /></form></div>;
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { hasAdminGrant } from "@/features/auth/authorization";
import { requireUser } from "@/features/auth/guards";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { ProfileForm, DealerRequestForm } from "@/features/profiles/profile-form";
import { loadOwnProfile } from "@/features/profiles/service";
import { getDictionary } from "@/i18n/get-dictionary";

export const dynamic = "force-dynamic";
export default async function AccountPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { client, user } = await requireUser();
  const [account, admin, params] = await Promise.all([loadOwnProfile(client, user.id), hasAdminGrant(client, user.id), searchParams]);
  const { account: copy, auth } = getDictionary();
  const status = account?.dealer?.verification_status;
  const dealerLabel = status === "verified" ? copy.dealerStatuses.verified : status === "rejected" ? copy.dealerStatuses.rejected : copy.dealerStatuses.pending;
  return <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
    <h1 className="text-3xl font-semibold tracking-tight">{copy.title}</h1>
    <p className="mt-4 text-muted-foreground">{copy.description}</p>
    {params.message === "accessDenied" && <p role="alert" className="mt-5 rounded-md border border-border bg-muted p-4">{auth.messages.accessDenied}</p>}
    <div className="mt-7 rounded-lg border border-border p-5 sm:p-7">
      <p className="text-sm font-semibold">{copy.email}</p><p className="mt-1 break-all">{user.email}</p>
      {account ? <ProfileForm displayName={account.profile.display_name} preferredLocale={account.profile.preferred_locale} />
        : <p role="alert" className="mt-5">{copy.profileUnavailable}</p>}
    </div>
    {account && <section className="mt-7 rounded-lg border border-border p-5 sm:p-7">
      <h2 className="text-xl font-semibold">{copy.dealerTitle}</h2>
      {account.dealer ? <>
        <p className="mt-4">{account.dealer.business_name}</p>
        <p className="mt-2 text-sm text-muted-foreground">{copy.dealerStatusLabel}: {dealerLabel}</p>
      </> : <><p className="mt-3 text-muted-foreground">{copy.dealerDescription}</p><DealerRequestForm /></>}
    </section>}
    <section className="mt-7 space-y-5 rounded-lg border border-border p-5 sm:p-7">
      <h2 className="text-xl font-semibold">{copy.securityTitle}</h2>
      <Button asChild variant="outline"><Link href="/account/password">{copy.changePassword}</Link></Button>
      {admin && <div><Link href="/admin" className="inline-flex min-h-11 items-center text-primary underline">{copy.adminLink}</Link></div>}
      <SignOutButton />
    </section>
    <p className="mt-7 text-sm text-muted-foreground">{copy.marketplaceNotice}</p>
  </div>;
}

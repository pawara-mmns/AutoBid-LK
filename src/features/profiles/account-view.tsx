import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { ProfileForm, DealerRequestForm } from "@/features/profiles/profile-form";
import type { loadOwnProfile } from "@/features/profiles/service";
import { getDictionary, getSellerDictionary } from "@/i18n/get-dictionary";

export function AccountView({ email, account, admin, accessDenied }: {
  email: string; account: Awaited<ReturnType<typeof loadOwnProfile>>; admin: boolean; accessDenied: boolean;
}) {
  const { account: copy, auth, common } = getDictionary();
  const status = account?.dealer?.verification_status;
  const dealerLabel = status === "verified" ? copy.dealerStatuses.verified : status === "rejected" ? copy.dealerStatuses.rejected : copy.dealerStatuses.pending;
  return <div className="site-container max-w-5xl py-8 sm:py-12">
    <header className="flex flex-wrap items-start justify-between gap-5">
      <div><h1 className="text-3xl font-semibold tracking-tight">{copy.title}</h1><p className="mt-3 max-w-xl text-muted-foreground">{copy.description}</p></div>
      <div className="flex flex-wrap gap-3"><Button asChild><Link href="/seller/vehicles">{getSellerDictionary().dashboard}</Link></Button><Button asChild variant="outline"><Link href="/vehicles">{common.browse}</Link></Button></div>
    </header>
    {accessDenied && <p role="alert" className="mt-6 border-s-2 border-danger bg-muted px-4 py-3">{auth.messages.accessDenied}</p>}
    <div className="mt-8 grid gap-10 border-t border-border pt-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
      <section aria-labelledby="account-profile"><h2 id="account-profile" className="text-section font-semibold">{copy.profileTitle}</h2>
        <dl className="mt-5"><dt className="text-ui text-muted-foreground">{copy.email}</dt><dd className="mt-1 break-all font-medium">{email}</dd></dl>
        <p className="mt-2 text-ui text-muted-foreground">{copy.emailConfirmed}</p>
        {account ? <ProfileForm displayName={account.profile.display_name} preferredLocale={account.profile.preferred_locale} /> : <p role="alert" className="mt-5">{copy.profileUnavailable}</p>}
      </section>
      <section aria-labelledby="account-access" className="border-t border-border pt-8 lg:border-s lg:border-t-0 lg:ps-10 lg:pt-0">
        <h2 id="account-access" className="text-section font-semibold">{copy.securityTitle}</h2><p className="mt-3 text-ui text-muted-foreground">{copy.securityDescription}</p>
        <Button asChild variant="outline" className="mt-5 w-full"><Link href="/account/password">{copy.changePassword}</Link></Button>
        {admin && <Link href="/admin" className="mt-3 flex min-h-11 items-center rounded-sm text-primary underline underline-offset-4">{copy.adminLink}</Link>}
        <div className="mt-4"><SignOutButton /></div>
      </section>
    </div>
    {account && <details className="mt-10 border-y border-border py-3"><summary className="min-h-12 cursor-pointer rounded-sm py-3 font-semibold">{copy.dealerTitle}</summary>
      <div className="max-w-xl pb-5 pt-3">{account.dealer ? <><p className="break-words">{account.dealer.business_name}</p><p className="mt-2 text-ui text-muted-foreground">{copy.dealerStatusLabel}: {dealerLabel}</p></>
        : <><p className="text-muted-foreground">{copy.dealerDescription}</p><DealerRequestForm /></>}
      </div>
    </details>}
    <p className="mt-6 max-w-2xl text-ui text-muted-foreground">{copy.marketplaceNotice}</p>
  </div>;
}

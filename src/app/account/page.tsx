import { hasAdminGrant } from "@/features/auth/authorization";
import { requireUser } from "@/features/auth/guards";
import { AccountView } from "@/features/profiles/account-view";
import { loadOwnProfile } from "@/features/profiles/service";

export const dynamic = "force-dynamic";
export default async function AccountPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { client, user } = await requireUser();
  const [account, admin, params] = await Promise.all([loadOwnProfile(client, user.id), hasAdminGrant(client, user.id), searchParams]);
  return <AccountView email={user.email!} account={account} admin={admin} accessDenied={params.message === "accessDenied"} />;
}

import { AuthPage } from "@/features/auth/auth-page";
import { requireUser } from "@/features/auth/guards";

export const dynamic = "force-dynamic";
export default async function PasswordPage() {
  await requireUser("/account/password");
  return <AuthPage mode="password" />;
}

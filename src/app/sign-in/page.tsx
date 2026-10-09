import { AuthPage } from "@/features/auth/auth-page";

export const dynamic = "force-dynamic";
export default function SignInPage({ searchParams }: { searchParams: Promise<{ message?: string; next?: string }> }) {
  return <AuthPage mode="sign-in" searchParams={searchParams} />;
}

import { AuthPage, type AuthSearchParams } from "@/features/auth/auth-page";

export const dynamic = "force-dynamic";
export default function SignInPage({ searchParams }: { searchParams: AuthSearchParams }) {
  return <AuthPage mode="sign-in" searchParams={searchParams} />;
}

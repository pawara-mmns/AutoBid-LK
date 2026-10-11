import { AuthPage, type AuthSearchParams } from "@/features/auth/auth-page";

export const dynamic = "force-dynamic";
export default function SignUpPage({ searchParams }: { searchParams: AuthSearchParams }) { return <AuthPage mode="sign-up" searchParams={searchParams} />; }

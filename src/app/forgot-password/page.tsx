import { AuthPage, type AuthSearchParams } from "@/features/auth/auth-page";

export const dynamic = "force-dynamic";
export default function ForgotPasswordPage({ searchParams }: { searchParams: AuthSearchParams }) { return <AuthPage mode="recovery" searchParams={searchParams} />; }

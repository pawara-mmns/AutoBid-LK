import { AuthPage } from "@/features/auth/auth-page";

export const dynamic = "force-dynamic";
export default function ForgotPasswordPage() { return <AuthPage mode="recovery" />; }

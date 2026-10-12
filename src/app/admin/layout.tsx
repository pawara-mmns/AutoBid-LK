import { requireAdmin } from '@/features/auth/guards';
export default async function Layout({children}:{children:React.ReactNode}){await requireAdmin();return children;}

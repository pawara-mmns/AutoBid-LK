import { getAdminDictionary } from '@/i18n/get-dictionary';
export default function Loading(){return <p role="status" className="site-container py-12">{getAdminDictionary().loading}</p>;}

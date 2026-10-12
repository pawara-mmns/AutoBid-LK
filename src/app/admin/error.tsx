'use client';
import { getAdminDictionary } from '@/i18n/get-dictionary';
import { Button } from '@/components/ui/button';
export default function ErrorPage({reset}:{reset:()=>void}){const c=getAdminDictionary();return <div className="site-container py-12"><p role="alert">{c.unavailable}</p><Button variant="outline" className="mt-5" onClick={reset}>{c.reload}</Button></div>;}

'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { getAdminDictionary,getSellerDictionary } from '@/i18n/get-dictionary';
export function PrivateGallery({id,photos}:{id:string;photos:{id:string;slot:string}[]}) {
 const c=getAdminDictionary(),s=getSellerDictionary(),[index,setIndex]=useState(0),[failed,setFailed]=useState<string[]>([]);const photo=photos[index];
 if(!photo)return <p>{c.noPhoto}</p>;
 const label=s.photoSlots[photo.slot as keyof typeof s.photoSlots];
 return <section className="mt-6"><div className="overflow-hidden rounded-lg bg-muted">{failed.includes(photo.id)?<p role="status" className="p-8">{c.documentMissing}</p>:<Image src={`/admin/listings/${id}/photos/${photo.id}`} unoptimized alt={label} width={1200} height={900} className="aspect-[4/3] max-h-[34rem] w-full object-contain" onError={()=>setFailed(old=>[...old,photo.id])}/>}</div><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><Button variant="outline" disabled={index===0} onClick={()=>setIndex(i=>i-1)}>{c.previous}</Button><p aria-live="polite" className="order-first basis-full text-center text-ui">{label} · {index+1} / {photos.length}</p><Button variant="outline" disabled={index===photos.length-1} onClick={()=>setIndex(i=>i+1)}>{c.next}</Button></div></section>;
}

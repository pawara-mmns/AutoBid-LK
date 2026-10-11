"use client";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getSellerDictionary } from "@/i18n/get-dictionary";
import type { SellerPhoto } from "./photos";
type Slot = "front" | "back" | "interior" | "dashboard" | "extra";
export function VehiclePhotosStep({ id, photos, changed, readOnly = false, uploadState }: { id: string; photos: SellerPhoto[]; changed: (photos: SellerPhoto[]) => void; readOnly?: boolean; uploadState?: (busy: boolean) => void }) {
  const c = getSellerDictionary(); const [job, setJob] = useState<{ file: File; slot: Slot; progress: number; failed: boolean } | null>(null), [working, setWorking] = useState(false), [error, setError] = useState("");
  const upload = (file: File, slot: Slot) => {
    if (working) return; if (file.size > 8 * 1024 * 1024) { setError(c.unsupported); return; }
    setWorking(true); uploadState?.(true); setError(""); setJob({ file, slot, progress: 0, failed: false });
    const data = new FormData(); data.set("file", file); data.set("slot", slot); const request = new XMLHttpRequest();
    request.open("POST", `/seller/vehicles/${id}/photos`); request.timeout = 120000;
    request.upload.onprogress = (event) => { if (event.lengthComputable) setJob({ file, slot, progress: Math.round(event.loaded / event.total * 100), failed: false }); };
    const fail = (reason?: string) => { setJob({ file, slot, progress: 0, failed: true }); setError(reason === "unsupported" ? c.unsupported : reason === "limit" ? c.photoLimit : c.uploadFailed); };
    request.onload = () => { try { const result = JSON.parse(request.responseText); if (request.status === 200 && Array.isArray(result.photos)) { changed(result.photos); setJob(null); } else fail(result.error); } catch { fail(); } setWorking(false); uploadState?.(false); };
    request.onerror = request.ontimeout = () => { fail(); setWorking(false); uploadState?.(false); }; request.send(data);
  };
  const mutate = async (photoId: string, action: string) => {
    if (working) return; setWorking(true); uploadState?.(true); setError("");
    try { const response = await fetch(`/seller/vehicles/${id}/photos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photoId, action }) }); const result = await response.json(); if (!response.ok) throw new Error(); changed(result.photos); } catch { setError(c.uploadFailed); } finally { setWorking(false); uploadState?.(false); }
  };
  return <div className="space-y-6"><p className="text-ui text-muted-foreground">{c.photoHelp}</p>{!readOnly && <div className="space-y-5">{(["front", "back", "interior", "dashboard", "extra"] as const).map((slot) => <section key={slot} className="border-t border-border pt-4"><h2 className="font-medium">{c.photoSlots[slot]}</h2><div className="mt-3 flex flex-wrap gap-3">{([true, false] as const).map((camera) => <label key={String(camera)} className={`inline-flex min-h-12 cursor-pointer items-center justify-center rounded-md border border-control-border px-4 py-3 text-ui font-medium focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring ${working || photos.length >= 12 ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}><span>{camera ? c.takePhoto : c.gallery}</span><input type="file" accept="image/jpeg,image/png,image/webp" capture={camera ? "environment" : undefined} aria-label={`${camera ? c.takePhoto : c.gallery}: ${c.photoSlots[slot]}`} className="sr-only" disabled={working || photos.length >= 12} onChange={(e) => { const file = e.target.files?.[0]; if (file) upload(file, slot); e.target.value = ""; }} /></label>)}</div></section>)}</div>}
    {job && <div role="status" aria-live="polite" className="border-s-2 border-primary ps-4"><p className="break-words">{c.photoSlots[job.slot]} · {job.failed ? c.uploadFailed : job.progress === 100 ? c.processing : `${c.upload} ${job.progress}%`}</p>{!job.failed && <progress value={job.progress} max={100} className="mt-3 w-full" />}{job.failed && <Button variant="outline" className="mt-3" onClick={() => upload(job.file, job.slot)}>{c.retryUpload}</Button>}</div>}
    {error && <p role="alert" className="text-ui text-danger">{error}</p>}{photos.length >= 12 && !readOnly && <p>{c.photoLimit}</p>}
    <ul className="grid gap-5 sm:grid-cols-2">{photos.map((photo, index) => <li key={photo.id} className="min-w-0 border-t border-border pt-4">{photo.uploaded_at ? <Image src={`/seller/vehicles/${id}/photos/${photo.id}`} unoptimized alt={c.photoSlots[photo.slot as Slot]} width={640} height={480} className="aspect-[4/3] w-full rounded-md object-cover" /> : <p className="py-6">{c.incompletePhoto}</p>}<p className="mt-3 font-medium">{c.photoSlots[photo.slot as Slot]}{photo.is_cover ? ` · ${c.cover}` : ""}</p>{!readOnly && <div className="mt-2 flex flex-wrap gap-2">{!photo.is_cover && photo.uploaded_at && <Button variant="outline" disabled={working} onClick={() => { void mutate(photo.id, "cover"); }}>{c.chooseCover}</Button>}<Button variant="ghost" disabled={working} onClick={() => { void mutate(photo.id, "remove"); }}>{c.remove}</Button><Button variant="ghost" disabled={working || index === 0} onClick={() => { void mutate(photo.id, "earlier"); }}>{c.moveEarlier}</Button><Button variant="ghost" disabled={working || index === photos.length - 1} onClick={() => { void mutate(photo.id, "later"); }}>{c.moveLater}</Button></div>}</li>)}</ul>
  </div>;
}

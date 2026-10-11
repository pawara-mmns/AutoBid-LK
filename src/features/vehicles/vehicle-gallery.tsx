"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehiclePhoto } from "@/features/vehicles/vehicle-photo";
import type { VehicleMedia } from "@/features/vehicles/types";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehicleGallery({ vehicleId, title, media }: { vehicleId: string; title: string; media: VehicleMedia[] }) {
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const gesture = useRef<{ x: number; y: number; id: number } | null>(null);
  const swiped = useRef(false);
  const dialogTitle = useId();
  const copy = getDictionary().vehicles;
  const current = media[selected];
  const alt = (photo: VehicleMedia | undefined, index: number) => photo?.alt_text ?? copy.photoAlt.replace("{vehicle}", title).replace("{number}", String(index + 1));
  const source = current ? `/vehicle-images/${vehicleId}/${current.id}` : undefined;
  const select = (index: number) => setSelected((index + media.length) % media.length);
  const keyboard = (event: KeyboardEvent) => {
    if (event.key === "Tab" && event.currentTarget instanceof HTMLDialogElement) {
      const controls = event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), [tabindex='0']");
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      return;
    }
    if (media.length < 2 || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); select(selected - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); select(selected + 1); }
    if (event.key === "Home") { event.preventDefault(); select(0); }
    if (event.key === "End") { event.preventDefault(); select(media.length - 1); }
  };
  const pointerDown = (event: PointerEvent) => {
    swiped.current = false;
    if (event.isPrimary && event.pointerType !== "mouse") gesture.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  };
  const pointerUp = (event: PointerEvent) => {
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.id !== event.pointerId || media.length < 2) return;
    const x = event.clientX - start.x, y = event.clientY - start.y;
    // Keep vertical page scrolling native; only a deliberate horizontal swipe selects a photo.
    if (Math.abs(x) >= 50 && Math.abs(x) > Math.abs(y) * 1.5) {
      swiped.current = true;
      select(selected + (x < 0 ? 1 : -1));
    }
  };
  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = previous; };
  }, [open]);
  const controls = () => <div className="flex items-center justify-between gap-3">
    {media.length > 1 ? <Button variant="outline" aria-label={copy.previousPhoto} className="w-12 px-0" onClick={() => select(selected - 1)}><ChevronLeft aria-hidden="true" /></Button> : <span />}
    <p role="status" aria-live="polite" aria-atomic="true" className="text-ui text-muted-foreground">{copy.photoCounter.replace("{current}", String(selected + 1)).replace("{total}", String(media.length))}</p>
    {media.length > 1 ? <Button variant="outline" aria-label={copy.nextPhoto} className="w-12 px-0" onClick={() => select(selected + 1)}><ChevronRight aria-hidden="true" /></Button> : <span />}
  </div>;
  return <section aria-label={copy.gallery}>
    {current ? <button type="button" aria-label={copy.openPhotos.replace("{vehicle}", title)} aria-haspopup="dialog"
      onKeyDown={keyboard} onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={() => { gesture.current = null; }}
      onClick={() => { if (swiped.current) { swiped.current = false; return; } dialog.current?.showModal(); setOpen(true); }}
      className="relative block w-full touch-pan-y overflow-hidden rounded-md border border-border">
      <VehiclePhoto key={current.id} src={source} alt={alt(current, selected)} sizes="(min-width: 1280px) 720px, (min-width: 1024px) 60vw, (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)" priority={selected === 0} fit="contain" loadingLabel={copy.photoLoading} />
      <span aria-hidden="true" className="absolute bottom-3 end-3 inline-flex min-h-11 items-center gap-2 rounded-md border border-control-border bg-surface px-3 text-ui font-medium"><Expand className="size-4" />{copy.expandPhoto}</span>
    </button> : <div className="overflow-hidden rounded-md border border-border"><VehiclePhoto alt={alt(undefined, 0)} fit="contain" /></div>}
    {!!media.length && <div className="mt-3">{controls()}</div>}
    {media.length > 1 && <div className="mt-3 hidden gap-3 overflow-x-auto px-1 py-1 md:flex" aria-label={copy.photoThumbnails}>{media.map((photo, index) => <button key={photo.id} type="button" onKeyDown={keyboard} onClick={() => setSelected(index)} aria-pressed={index === selected} aria-label={copy.photoSelect.replace("{number}", String(index + 1))}
      className={`w-22 shrink-0 overflow-hidden rounded-md border-2 ${index === selected ? "border-primary" : "border-control-border"}`}>
      <VehiclePhoto src={`/vehicle-images/${vehicleId}/${photo.id}`} alt={alt(photo, index)} sizes="88px" />
    </button>)}</div>}
    {current && <dialog ref={dialog} aria-labelledby={dialogTitle} onKeyDown={keyboard} onClose={() => setOpen(false)}
      className="fixed inset-0 m-0 h-dvh max-h-dvh w-full max-w-none overflow-hidden border-0 bg-background p-0 text-foreground open:flex open:flex-col">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3 sm:px-8">
        <h2 id={dialogTitle} className="min-w-0 break-words text-lg font-semibold">{title} — {copy.gallery}</h2>
        <Button variant="ghost" aria-label={copy.closePhotos} className="w-12 shrink-0 px-0" onClick={() => dialog.current?.close()}><X aria-hidden="true" /></Button>
      </div>
      {open && <div tabIndex={0} role="group" aria-label={copy.photoViewer} className="min-h-0 flex-1 touch-pan-y focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={() => { gesture.current = null; }}>
        <VehiclePhoto key={current.id} src={source} alt={alt(current, selected)} sizes="100vw" fit="contain" className="h-full aspect-auto" loadingLabel={copy.photoLoading} />
      </div>}
      <div className="shrink-0 border-t border-border bg-surface px-5 py-3 sm:px-8">{controls()}</div>
    </dialog>}
  </section>;
}

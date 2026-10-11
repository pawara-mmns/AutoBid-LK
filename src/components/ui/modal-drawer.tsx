"use client";

import { useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ModalDrawer({ title, closeLabel, trigger, children }: { title: string; closeLabel: string; trigger: ReactNode; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return <>
    <Button type="button" variant="outline" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>{trigger}</Button>
    <dialog ref={dialog} aria-labelledby={titleId} onClick={(event) => { if (event.target instanceof Element && event.target.closest("a[href]")) dialog.current?.close(); }} className="fixed inset-x-0 bottom-0 top-auto m-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-lg border border-border bg-surface p-5 text-foreground shadow-lg backdrop:bg-black/40 sm:bottom-auto sm:top-[10vh] sm:rounded-lg">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 id={titleId} className="text-xl font-semibold">{title}</h2>
        <form method="dialog"><Button type="submit" variant="ghost" aria-label={closeLabel}><X aria-hidden="true" /></Button></form>
      </div>
      {children}
    </dialog>
  </>;
}

"use client";

import { useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function ModalDrawer({ title, closeLabel, trigger, children, fullHeight = false }: { title: string; closeLabel: string; trigger: ReactNode; children: ReactNode; fullHeight?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return <>
    <Button type="button" variant="outline" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>{trigger}</Button>
    <dialog ref={dialog} aria-labelledby={titleId} onClick={(event) => { if (event.target instanceof Element && event.target.closest("a[href]")) dialog.current?.close(); }} className={cn("fixed w-full overflow-y-auto border border-border bg-surface p-5 text-foreground shadow-lg backdrop:bg-black/40",
      fullHeight ? "inset-0 m-auto h-dvh max-h-dvh max-w-lg overflow-hidden open:flex open:flex-col" : "inset-x-0 bottom-0 top-auto m-auto max-h-[90dvh] max-w-lg rounded-t-lg sm:bottom-auto sm:top-[10vh] sm:rounded-lg")}>
      <div className={cn("mb-6 flex items-center justify-between gap-4", fullHeight && "-mx-5 mb-0 shrink-0 border-b border-border bg-surface px-5 pb-3")}>
        <h2 id={titleId} className="text-xl font-semibold">{title}</h2>
        <form method="dialog"><Button type="submit" variant="ghost" aria-label={closeLabel}><X aria-hidden="true" /></Button></form>
      </div>
      {children}
    </dialog>
  </>;
}

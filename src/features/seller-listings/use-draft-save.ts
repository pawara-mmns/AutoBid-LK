"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { saveDraft } from "./actions";
import type { SellerForm } from "./schema";
export function useDraftSave(id: string, revision: number, form: SellerForm, step: number, enabled: boolean) {
  const [state, setState] = useState<"saved" | "saving" | "failed" | "conflict">("saved");
  const current = useRef({ form, step }), saved = useRef(JSON.stringify({ form, step })), version = useRef(revision), pending = useRef<Promise<boolean> | null>(null), conflict = useRef(false);
  const flush = useCallback(async function flushTask(): Promise<boolean> {
    if (!enabled || conflict.current) return !conflict.current;
    if (pending.current) { const ok = await pending.current; return ok ? flushTask() : false; }
    const snapshot = current.current; const serialized = JSON.stringify(snapshot);
    if (serialized === saved.current) return true;
    setState("saving");
    const task = (async () => {
      try {
        const result = await saveDraft({ id, revision: version.current, ...snapshot });
        if (!result.ok) { conflict.current = result.conflict; setState(result.conflict ? "conflict" : "failed"); return false; }
        version.current = result.revision; saved.current = serialized; setState("saved"); return true;
      } catch { setState("failed"); return false; }
    })();
    pending.current = task; const result = await task; if (pending.current === task) pending.current = null;
    if (result && JSON.stringify(current.current) !== saved.current) return flushTask();
    return result;
  }, [enabled, id]);
  useEffect(() => { current.current = { form, step }; if (!enabled || JSON.stringify({ form, step }) === saved.current || conflict.current) return; const timer = setTimeout(() => { void flush(); }, 800); return () => clearTimeout(timer); }, [form, step, enabled, flush]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (enabled && JSON.stringify(current.current) !== saved.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    const links = (e: MouseEvent) => { const link = (e.target as Element).closest("a"); if (link && !link.target && enabled && JSON.stringify(current.current) !== saved.current) { e.preventDefault(); void flush().then((ok) => { if (ok) window.location.assign(link.href); }); } };
    document.addEventListener("click", links); return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", links); };
  }, [enabled, flush]);
  const markDirty = useCallback(() => { if (!conflict.current) setState("saving"); }, []);
  return { state, flush, version, markDirty };
}

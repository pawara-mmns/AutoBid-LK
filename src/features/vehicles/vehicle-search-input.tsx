"use client";

import { useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehicleSearchInput({ id, initialValue, placeholder }: { id: string; initialValue: string; placeholder: string }) {
  const [value, setValue] = useState(initialValue);
  const input = useRef<HTMLInputElement>(null);
  return <div className="relative min-w-0 flex-1">
    <Search aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
    <Input ref={input} id={id} name="q" type="search" value={value} onChange={(event) => setValue(event.target.value)}
      maxLength={80} placeholder={placeholder} enterKeyHint="search" autoComplete="off" className="ps-12 pe-14 [&::-webkit-search-cancel-button]:appearance-none" />
    {value && <Button type="button" variant="ghost" aria-label={getDictionary().vehicles.clearSearch}
      className="absolute end-1 top-1/2 min-h-11 w-11 -translate-y-1/2 px-0 py-0"
      onClick={() => { setValue(""); input.current?.focus(); }}><X aria-hidden="true" /></Button>}
  </div>;
}

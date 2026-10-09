"use client";

import Image from "next/image";
import { Camera } from "lucide-react";
import { useState } from "react";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehiclePhoto({ src, alt, sizes = "(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw", priority = false }: { src?: string; alt: string; sizes?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
    {src && !failed ? <Image src={src} alt={alt} fill sizes={sizes} preload={priority} className="object-cover" onError={() => setFailed(true)} />
      : <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground"><Camera aria-hidden="true" className="size-8" strokeWidth={1.5} /><span className="text-sm">{getDictionary().vehicles.photoMissing}</span></div>}
  </div>;
}

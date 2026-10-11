"use client";

import Image from "next/image";
import { Camera } from "lucide-react";
import { useState } from "react";
import { getDictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils/cn";

export function VehiclePhoto({ src, alt, sizes = "(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw", priority = false, fit = "cover", className, loadingLabel }: { src?: string; alt: string; sizes?: string; priority?: boolean; fit?: "cover" | "contain"; className?: string; loadingLabel?: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return <div className={cn("relative aspect-[4/3] w-full overflow-hidden bg-muted", className)}>
    {src && !failed ? <><Image src={src} alt={alt} fill sizes={sizes} preload={priority} className={fit === "contain" ? "object-contain" : "object-cover"} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
      {loadingLabel && !loaded && <span role="status" className="absolute inset-0 flex items-center justify-center px-4 text-center text-ui text-muted-foreground">{loadingLabel}</span>}</>
      : <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground"><Camera aria-hidden="true" className="size-8" strokeWidth={1.5} /><span className="text-sm">{getDictionary().vehicles.photoMissing}</span></div>}
  </div>;
}

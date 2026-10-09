"use client";

import { useState } from "react";
import { VehiclePhoto } from "@/features/vehicles/vehicle-photo";
import type { VehicleMedia } from "@/features/vehicles/types";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehicleGallery({ vehicleId, title, media }: { vehicleId: string; title: string; media: VehicleMedia[] }) {
  const [selected, setSelected] = useState(0);
  const copy = getDictionary().vehicles;
  const current = media[selected];
  const alt = (photo: VehicleMedia | undefined, index: number) => photo?.alt_text ?? copy.photoAlt.replace("{vehicle}", title).replace("{number}", String(index + 1));
  return <section aria-label={copy.gallery}>
    <div className="overflow-hidden rounded-lg border border-border"><VehiclePhoto key={current?.id ?? "missing"} src={current ? `/vehicle-images/${vehicleId}/${current.id}` : undefined} alt={alt(current, selected)} sizes="(max-width: 1023px) 100vw, 66vw" priority /></div>
    {media.length > 1 && <div className="mt-3 flex flex-wrap gap-3">{media.map((photo, index) => <button key={photo.id} type="button" onClick={() => setSelected(index)} aria-pressed={index === selected} aria-label={copy.photoSelect.replace("{number}", String(index + 1))}
      className={`w-20 overflow-hidden rounded-md border-2 ${index === selected ? "border-primary" : "border-border"}`}>
      <VehiclePhoto src={`/vehicle-images/${vehicleId}/${photo.id}`} alt={alt(photo, index)} sizes="80px" />
    </button>)}</div>}
  </section>;
}

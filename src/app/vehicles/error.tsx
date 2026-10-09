"use client";

import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n/get-dictionary";

export default function VehiclesError({ reset }: { reset: () => void }) {
  const copy = getDictionary().vehicles;
  return <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8"><h1 className="text-2xl font-semibold">{copy.unavailableTitle}</h1>
    <p role="alert" className="mt-4 text-muted-foreground">{copy.unavailableDescription}</p><Button onClick={reset} className="mt-6">{copy.tryAgain}</Button>
  </div>;
}

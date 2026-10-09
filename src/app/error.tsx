"use client";

import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n/get-dictionary";

export default function ErrorPage({ reset }: { reset: () => void }) {
  const copy = getDictionary().error;
  return <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
    <h1 className="text-3xl font-semibold">{copy.title}</h1>
    <p role="alert" className="mt-4 text-muted-foreground">{copy.description}</p>
    <Button className="mt-6" onClick={reset}>{copy.action}</Button>
  </div>;
}

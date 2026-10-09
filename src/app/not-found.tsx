import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n/get-dictionary";

export default function NotFound() {
  const copy = getDictionary().notFound;
  return <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
    <h1 className="text-3xl font-semibold">{copy.title}</h1>
    <p className="mt-4 text-muted-foreground">{copy.description}</p>
    <Button asChild className="mt-6"><Link href="/">{copy.action}</Link></Button>
  </div>;
}

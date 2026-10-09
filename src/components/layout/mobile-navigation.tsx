import Link from "next/link";
import { Menu } from "lucide-react";
import { ModalDrawer } from "@/components/ui/modal-drawer";
import { getDictionary } from "@/i18n/get-dictionary";

export function MobileNavigation() {
  const copy = getDictionary().common;
  return <div className="md:hidden"><ModalDrawer title={copy.menu} closeLabel={copy.close} trigger={<><Menu aria-hidden="true" className="size-4" /><span>{copy.menu}</span></>}>
    <nav aria-label={copy.navigation} className="flex flex-col gap-3">
      <Link href="/vehicles" className="rounded-md bg-primary p-4 font-semibold text-primary-foreground">{copy.browse}</Link>
      <Link href="/sell" className="rounded-md border border-border p-4 font-semibold">{copy.sell}</Link>
      <Link href="/account" className="rounded-md border border-border p-4 font-semibold">{copy.account}</Link>
    </nav>
  </ModalDrawer></div>;
}

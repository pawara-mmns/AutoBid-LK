import { notFound } from "next/navigation";
import { InformationPage, type InformationKind } from "@/features/marketplace/information-page";

const kinds: readonly string[] = ["about", "contact", "help", "terms", "privacy", "sell"];
export function generateStaticParams() { return kinds.map((information) => ({ information })); }
export default async function PublicInformationPage({ params }: { params: Promise<{ information: string }> }) {
  const { information } = await params;
  if (!kinds.includes(information)) notFound();
  return <InformationPage kind={information as InformationKind} />;
}

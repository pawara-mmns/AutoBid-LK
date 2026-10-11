import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/features/auth/guards";
import { loadSellerListing } from "./queries";
import { loadSellerPhotos } from "./photos";
// Request-local reuse; authorize before the child loading boundary can stream a 200.
export const sellerPageData = cache(async (id: string) => {
  if (!z.uuid().safeParse(id).success) notFound();
  const { client, user } = await requireUser(`/seller/vehicles/${id}`);
  const listing = await loadSellerListing(client, user.id, id); if (!listing) notFound();
  return { listing, photos: await loadSellerPhotos(client, listing.id), email: user.email! };
});

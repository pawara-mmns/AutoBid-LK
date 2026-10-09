import { z } from "zod";
import { queryVehiclePhoto } from "@/features/vehicles/queries";

export async function GET(_request: Request, { params }: { params: Promise<{ listingId: string; photoId: string }> }) {
  const parsed = z.object({ listingId: z.uuid(), photoId: z.uuid() }).safeParse(await params);
  if (!parsed.success) return new Response(null, { status: 404 });
  const photo = await queryVehiclePhoto(parsed.data.listingId, parsed.data.photoId);
  if (!photo) return new Response(null, { status: 404 });
  return new Response(photo, { headers: {
    "Content-Type": photo.type, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline", "Content-Security-Policy": "default-src 'none'; sandbox",
  } });
}

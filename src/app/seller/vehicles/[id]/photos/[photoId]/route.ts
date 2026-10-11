import { handlePhotoPreview } from "@/features/seller-listings/photo-routes";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) { const p = await params; return handlePhotoPreview(p.id, p.photoId); }

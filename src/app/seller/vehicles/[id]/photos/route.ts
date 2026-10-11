import { handlePhotoMutation } from "@/features/seller-listings/photo-routes";
export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return handlePhotoMutation(request, (await params).id); }

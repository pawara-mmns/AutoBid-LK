import sharp from "sharp";
export const maxPhotoBytes = 8 * 1024 * 1024;
export async function optimizeSellerPhoto(input: Uint8Array) {
  if (!input.byteLength || input.byteLength > maxPhotoBytes) throw new Error("unsupported_photo");
  // Decode the actual raster, bound pixel work, reject SVG/animation and strip metadata.
  const decoder = sharp(input, { limitInputPixels: 24000000, failOn: "warning" });
  const meta = await decoder.metadata();
  if (!["jpeg", "png", "webp"].includes(meta.format ?? "") || (meta.pages ?? 1) > 1 || !meta.width || !meta.height) throw new Error("unsupported_photo");
  return decoder.rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 82, progressive: true }).toBuffer();
}

import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { it, expect } from "vitest";
import { optimizeSellerPhoto } from "@/features/seller-listings/image-validation";
import { readBoundedBody } from "@/features/seller-listings/request-body";
it("decodes real bytes and creates a bounded metadata-free JPEG", async () => {
  const input = await readFile(new URL("../fixtures/vehicle-photo.png", import.meta.url)); const output = await optimizeSellerPhoto(input); const metadata = await sharp(output).metadata(); expect(metadata.format).toBe("jpeg"); expect(metadata.width).toBeLessThanOrEqual(1600); expect(metadata.exif).toBeUndefined();
});
it("bounds actual mutation bytes even when the length header is missing or dishonest", async () => {
  for (const headers of [new Headers(), new Headers({ "Content-Length": "1" })]) await expect(readBoundedBody(new Request("https://example.invalid", { method: "POST", headers, body: "12345" }), 4)).rejects.toThrow("size_limit");
});
it("accepts a bounded request without trusting file or JSON declarations", async () => { expect((await readBoundedBody(new Request("https://example.invalid", { method: "POST", body: "1234" }), 4)).toString()).toBe("1234"); });
it("rejects malformed raster data, SVG and oversized inputs", async () => {
  for (const input of [Buffer.from("not a JPG"), Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'), Buffer.alloc(8 * 1024 * 1024 + 1)]) await expect(optimizeSellerPhoto(input)).rejects.toThrow();
});

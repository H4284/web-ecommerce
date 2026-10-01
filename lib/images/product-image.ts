import "server-only";
import sharp from "sharp";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  IMAGE_WIDTHS,
  MAX_IMAGE_BYTES,
  nextImageIndex,
} from "@/lib/images/widths";
import type { ImageRef } from "@/lib/shop/schemas";

export { nextImageIndex };
export class ImageTooLargeError extends Error {
  constructor() {
    super("image_too_large");
    this.name = "ImageTooLargeError";
  }
}

async function uploadWebpSizes(opts: {
  bucket: "products" | "content";
  objectBase: string;
  buffer: Buffer;
}): Promise<void> {
  const admin = getSupabaseAdmin();
  const oriented = await sharp(opts.buffer).rotate().toBuffer();

  for (const width of IMAGE_WIDTHS) {
    const webp = await sharp(oriented)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const objectPath = `${opts.objectBase}-${width}.webp`;
    const { error } = await admin.storage
      .from(opts.bucket)
      .upload(objectPath, webp, {
        contentType: "image/webp",
        upsert: true,
        cacheControl: "31536000",
      });
    if (error) throw error;
  }
}

/** Strip EXIF, write WebP at 320/640/960/1280, upload to Supabase Storage.
 * Returns the product image path without width suffix (`products/{id}/{index}`).
 */
export async function resizeAndUploadProductImage(opts: {
  productId: string;
  index: number;
  buffer: Buffer;
  alt: string;
}): Promise<ImageRef> {
  if (opts.buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new ImageTooLargeError();
  }

  const objectBase = `${opts.productId}/${opts.index}`;
  await uploadWebpSizes({
    bucket: "products",
    objectBase,
    buffer: opts.buffer,
  });

  return { path: `products/${objectBase}`, alt: opts.alt };
}

/** Shared helper for content/home images. */
export async function resizeAndUploadContentImage(opts: {
  prefix: string;
  index: number;
  buffer: Buffer;
}): Promise<string> {
  if (opts.buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new ImageTooLargeError();
  }

  // prefix like `content/home` → bucket content, object `home/{index}`
  const withoutContent = opts.prefix.replace(/^content\//, "");
  const objectBase = `${withoutContent}/${opts.index}`;
  await uploadWebpSizes({
    bucket: "content",
    objectBase,
    buffer: opts.buffer,
  });

  return `content/${objectBase}`;
}

/** True if a 320px WebP exists for this logical path. */
export async function productImageExists(path: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const withoutPrefix = path.replace(/^products\//, "");
  const objectPath = `${withoutPrefix}-320.webp`;
  const { data, error } = await admin.storage
    .from("products")
    .download(objectPath);
  if (error || !data) return false;
  return true;
}

import "server-only";
import sharp from "sharp";
import { getBucket } from "@/lib/firebase/admin";
import {
  IMAGE_CACHE_CONTROL,
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

/** Strip EXIF, write WebP at 320/640/960/1280, upload to Storage.
 * Returns the product image path without width suffix.
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

  const bucket = getBucket();
  const basePath = `products/${opts.productId}/${opts.index}`;

  // rotate() applies EXIF orientation and drops metadata on output.
  const oriented = await sharp(opts.buffer).rotate().toBuffer();

  for (const width of IMAGE_WIDTHS) {
    const webp = await sharp(oriented)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const objectPath = `${basePath}-${width}.webp`;
    await bucket.file(objectPath).save(webp, {
      contentType: "image/webp",
      resumable: false,
      metadata: { cacheControl: IMAGE_CACHE_CONTROL },
    });
  }

  return { path: basePath, alt: opts.alt };
}

/** Shared helper for content/home images (unit 30). */
export async function resizeAndUploadContentImage(opts: {
  prefix: string;
  index: number;
  buffer: Buffer;
}): Promise<string> {
  if (opts.buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new ImageTooLargeError();
  }

  const bucket = getBucket();
  const basePath = `${opts.prefix}/${opts.index}`;
  const oriented = await sharp(opts.buffer).rotate().toBuffer();

  for (const width of IMAGE_WIDTHS) {
    const webp = await sharp(oriented)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    await bucket.file(`${basePath}-${width}.webp`).save(webp, {
      contentType: "image/webp",
      resumable: false,
      metadata: { cacheControl: IMAGE_CACHE_CONTROL },
    });
  }

  return basePath;
}

import "server-only";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db, getBucket } from "@/lib/firebase/admin";
import { adminAction } from "@/lib/shop/admin";
import {
  ImageTooLargeError,
  resizeAndUploadProductImage,
} from "@/lib/images/product-image";
import { MAX_IMAGE_BYTES, nextImageIndex } from "@/lib/images/widths";
import { productSchema } from "@/lib/shop/schemas";

const metaSchema = z.object({
  productId: z.string().min(1),
  alt: z.string().min(1),
});

export { ImageTooLargeError, MAX_IMAGE_BYTES };

/** Upload one product image; appends to `images` and bumps catalog tag. */
export async function uploadAdminProductImage(opts: {
  productId: string;
  alt: string;
  buffer: Buffer;
}) {
  return adminAction({
    schema: metaSchema,
    action: "product.imageUpload",
    target: (d) => `products/${d.productId}`,
    input: { productId: opts.productId, alt: opts.alt },
    fn: async (data) => {
      if (opts.buffer.byteLength > MAX_IMAGE_BYTES) {
        throw new ImageTooLargeError();
      }

      const ref = db.collection("products").doc(data.productId);
      const snap = await ref.get();
      if (!snap.exists) throw new Error("Product not found");

      const parsed = productSchema.safeParse(snap.data());
      if (!parsed.success) throw new Error("Invalid product");

      const images = parsed.data.images ?? [];
      let index = nextImageIndex(images);
      let replacePlaceholder = false;

      if (images.length === 1) {
        const only = images[0]!;
        const [exists] = await getBucket()
          .file(`${only.path}-320.webp`)
          .exists();
        if (!exists) {
          const match = /\/(\d+)$/.exec(only.path);
          index = match ? Number(match[1]) : 0;
          replacePlaceholder = true;
        }
      }

      const image = await resizeAndUploadProductImage({
        productId: data.productId,
        index,
        buffer: opts.buffer,
        alt: data.alt,
      });

      const nextImages = replacePlaceholder ? [image] : [...images, image];
      await ref.set(
        {
          images: nextImages,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      updateTag("catalog");
      return image;
    },
  });
}

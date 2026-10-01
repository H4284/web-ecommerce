import "server-only";
import { updateTag } from "next/cache";
import { z } from "zod";
import { adminAction } from "@/lib/shop/admin";
import {
  ImageTooLargeError,
  productImageExists,
  resizeAndUploadProductImage,
} from "@/lib/images/product-image";
import { MAX_IMAGE_BYTES, nextImageIndex } from "@/lib/images/widths";
import { productFromRow, productToRow } from "@/lib/shop/supabase-mappers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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

      const admin = getSupabaseAdmin();
      const { data: row, error } = await admin
        .from("products")
        .select("*")
        .eq("id", data.productId)
        .maybeSingle();
      if (error) throw error;
      if (!row) throw new Error("Product not found");

      const product = productFromRow(row as Record<string, unknown>);
      const images = product.images ?? [];
      let index = nextImageIndex(images);
      let replacePlaceholder = false;

      if (images.length === 1) {
        const only = images[0]!;
        const exists = await productImageExists(only.path);
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
      const next = {
        ...product,
        images: nextImages,
        updatedAt: new Date().toISOString(),
      };
      const { error: upErr } = await admin
        .from("products")
        .update(productToRow(next))
        .eq("id", data.productId);
      if (upErr) throw upErr;
      updateTag("catalog");
      return image;
    },
  });
}

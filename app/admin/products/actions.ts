"use server";

import {
  StockConflictError,
  bulkSetProductStatus,
  saveAdminProduct,
  updateAdminStock,
} from "@/lib/shop/admin-products";
import {
  ImageTooLargeError,
  MAX_IMAGE_BYTES,
  uploadAdminProductImage,
} from "@/lib/shop/admin-images";

export type ActionResult =
  | { ok: true; id?: string; stock?: number; count?: number }
  | { ok: false; error: string };

export async function saveProductAction(input: unknown): Promise<ActionResult> {
  try {
    const result = await saveAdminProduct(input);
    return { ok: true, id: result.id };
  } catch (err) {
    console.error("[admin] saveProduct", err);
    return { ok: false, error: "save_failed" };
  }
}

export async function updateStockAction(input: unknown): Promise<ActionResult> {
  try {
    const result = await updateAdminStock(input);
    return { ok: true, stock: result.stock };
  } catch (err) {
    if (err instanceof StockConflictError) {
      return { ok: false, error: "stock_changed" };
    }
    if (err instanceof Error && err.message === "stock_changed") {
      return { ok: false, error: "stock_changed" };
    }
    console.error("[admin] updateStock", err);
    return { ok: false, error: "stock_failed" };
  }
}

export async function bulkStatusAction(input: unknown): Promise<ActionResult> {
  try {
    const result = await bulkSetProductStatus(input);
    return { ok: true, count: result.count };
  } catch (err) {
    console.error("[admin] bulkStatus", err);
    return { ok: false, error: "bulk_failed" };
  }
}

export type UploadImageResult =
  | { ok: true; image: { path: string; alt: string } }
  | { ok: false; error: string };

export async function uploadProductImageAction(
  formData: FormData,
): Promise<UploadImageResult> {
  try {
    const productId = String(formData.get("productId") ?? "");
    const alt = String(formData.get("alt") ?? "").trim();
    const file = formData.get("file");

    if (!productId || !alt) {
      return { ok: false, error: "invalid" };
    }
    if (!(file instanceof File)) {
      return { ok: false, error: "invalid" };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: "image_too_large" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      return { ok: false, error: "image_too_large" };
    }

    const image = await uploadAdminProductImage({ productId, alt, buffer });
    return { ok: true, image };
  } catch (err) {
    if (err instanceof ImageTooLargeError) {
      return { ok: false, error: "image_too_large" };
    }
    if (err instanceof Error && err.message === "image_too_large") {
      return { ok: false, error: "image_too_large" };
    }
    console.error("[admin] uploadImage", err);
    return { ok: false, error: "upload_failed" };
  }
}

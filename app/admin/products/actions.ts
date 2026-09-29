"use server";

import {
  StockConflictError,
  bulkSetProductStatus,
  saveAdminProduct,
  updateAdminStock,
} from "@/lib/shop/admin-products";

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

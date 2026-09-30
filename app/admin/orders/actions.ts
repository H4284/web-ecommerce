"use server";

import {
  exportAdminOrdersCsv,
  markAdminOrderPaid,
  updateAdminOrderNote,
  updateAdminOrderStatus,
} from "@/lib/shop/admin-orders";
import type { ListOrdersFilter } from "@/lib/shop/admin-order-schema";

export type OrderActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateOrderStatusAction(
  input: unknown,
): Promise<OrderActionResult> {
  try {
    await updateAdminOrderStatus(input);
    return { ok: true };
  } catch (err) {
    console.error("[admin] updateOrderStatus", err);
    return { ok: false, error: "status_failed" };
  }
}

export async function markOrderPaidAction(
  input: unknown,
): Promise<OrderActionResult> {
  try {
    await markAdminOrderPaid(input);
    return { ok: true };
  } catch (err) {
    console.error("[admin] markOrderPaid", err);
    return { ok: false, error: "paid_failed" };
  }
}

export async function updateOrderNoteAction(
  input: unknown,
): Promise<OrderActionResult> {
  try {
    await updateAdminOrderNote(input);
    return { ok: true };
  } catch (err) {
    console.error("[admin] updateOrderNote", err);
    return { ok: false, error: "note_failed" };
  }
}

export async function exportOrdersCsvAction(
  filter: Partial<ListOrdersFilter>,
): Promise<{ ok: true; csv: string } | { ok: false; error: string }> {
  try {
    const csv = await exportAdminOrdersCsv(filter);
    return { ok: true, csv };
  } catch (err) {
    console.error("[admin] exportOrdersCsv", err);
    return { ok: false, error: "csv_failed" };
  }
}

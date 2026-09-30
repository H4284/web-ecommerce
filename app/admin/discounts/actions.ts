"use server";

import {
  saveAdminDiscount,
  setAdminDiscountActive,
} from "@/lib/shop/admin-discounts";

export type DiscountActionResult =
  | { ok: true; code?: string; usedCount?: number }
  | { ok: false; error: string };

export async function saveDiscountAction(
  input: unknown,
): Promise<DiscountActionResult> {
  try {
    const result = await saveAdminDiscount(input);
    return { ok: true, code: result.code, usedCount: result.usedCount };
  } catch (err) {
    console.error("[admin] saveDiscount", err);
    return { ok: false, error: "save_failed" };
  }
}

export async function setDiscountActiveAction(
  input: unknown,
): Promise<DiscountActionResult> {
  try {
    const result = await setAdminDiscountActive(input);
    return { ok: true, code: result.code };
  } catch (err) {
    console.error("[admin] setDiscountActive", err);
    return { ok: false, error: "active_failed" };
  }
}

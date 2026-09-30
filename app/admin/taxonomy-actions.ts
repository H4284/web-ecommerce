"use server";

import {
  TaxonomyInUseError,
  archiveAdminBrand,
  archiveAdminCategory,
  deleteAdminBrand,
  deleteAdminCategory,
  moveAdminCategory,
  saveAdminBrand,
  saveAdminCategory,
} from "@/lib/shop/admin-taxonomy";

export type TaxonomyActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export async function saveCategoryAction(
  input: unknown,
): Promise<TaxonomyActionResult> {
  try {
    const result = await saveAdminCategory(input);
    return { ok: true, id: result.id };
  } catch (err) {
    console.error("[admin] saveCategory", err);
    return { ok: false, error: "save_failed" };
  }
}

export async function moveCategoryAction(
  input: unknown,
): Promise<TaxonomyActionResult> {
  try {
    const result = await moveAdminCategory(input);
    return { ok: true, id: result.id };
  } catch (err) {
    console.error("[admin] moveCategory", err);
    return { ok: false, error: "move_failed" };
  }
}

export async function archiveCategoryAction(
  input: unknown,
): Promise<TaxonomyActionResult> {
  try {
    const result = await archiveAdminCategory(input);
    return { ok: true, id: result.id };
  } catch (err) {
    console.error("[admin] archiveCategory", err);
    return { ok: false, error: "archive_failed" };
  }
}

export async function deleteCategoryAction(
  input: unknown,
): Promise<TaxonomyActionResult> {
  try {
    const result = await deleteAdminCategory(input);
    return { ok: true, id: result.id };
  } catch (err) {
    if (err instanceof TaxonomyInUseError || (err instanceof Error && err.message === "category_in_use")) {
      return { ok: false, error: "in_use" };
    }
    console.error("[admin] deleteCategory", err);
    return { ok: false, error: "delete_failed" };
  }
}

export async function saveBrandAction(
  input: unknown,
): Promise<TaxonomyActionResult> {
  try {
    const result = await saveAdminBrand(input);
    return { ok: true, id: result.id };
  } catch (err) {
    console.error("[admin] saveBrand", err);
    return { ok: false, error: "save_failed" };
  }
}

export async function archiveBrandAction(
  input: unknown,
): Promise<TaxonomyActionResult> {
  try {
    const result = await archiveAdminBrand(input);
    return { ok: true, id: result.id };
  } catch (err) {
    console.error("[admin] archiveBrand", err);
    return { ok: false, error: "archive_failed" };
  }
}

export async function deleteBrandAction(
  input: unknown,
): Promise<TaxonomyActionResult> {
  try {
    const result = await deleteAdminBrand(input);
    return { ok: true, id: result.id };
  } catch (err) {
    if (err instanceof TaxonomyInUseError || (err instanceof Error && err.message === "brand_in_use")) {
      return { ok: false, error: "in_use" };
    }
    console.error("[admin] deleteBrand", err);
    return { ok: false, error: "delete_failed" };
  }
}

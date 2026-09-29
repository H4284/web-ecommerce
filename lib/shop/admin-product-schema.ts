import { z } from "zod";
import { slugify } from "@/lib/shop/slug";

const optionSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.string().min(1)).min(1),
});

const variantInputSchema = z.object({
  id: z.string().min(1).optional(),
  sku: z.string().min(1),
  optionValues: z.record(z.string(), z.string()),
  priceCents: z.number().int().nonnegative(),
  compareAtCents: z.number().int().nonnegative().nullable(),
  stock: z.number().int().nonnegative(),
  isDefault: z.boolean(),
});

export const saveProductInputSchema = z.object({
  id: z.string().min(1).nullable(),
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  brandId: z.string().min(1).nullable(),
  categoryIds: z.array(z.string().min(1)).min(1),
  shortDescription: z.string(),
  description: z.string(),
  images: z
    .array(z.object({ path: z.string().min(1), alt: z.string() }))
    .min(1),
  options: z.array(optionSchema).max(2),
  status: z.enum(["draft", "active", "archived"]),
  isNew: z.boolean(),
  isBestSeller: z.boolean(),
  unit: z
    .object({ amount: z.number().positive(), label: z.string().min(1) })
    .nullable(),
  relatedIds: z.array(z.string()),
  seoTitle: z.string(),
  seoDescription: z.string(),
  variants: z.array(variantInputSchema).min(1),
});

export type SaveProductInput = z.infer<typeof saveProductInputSchema>;

export const updateStockInputSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  expectedStock: z.number().int().nonnegative(),
  nextStock: z.number().int().nonnegative(),
});

export type UpdateStockInput = z.infer<typeof updateStockInputSchema>;

export const bulkProductStatusSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  status: z.enum(["draft", "active", "archived"]),
});

export type BulkProductStatusInput = z.infer<typeof bulkProductStatusSchema>;

/** Stable variant doc id from option values. */
export function variantIdFromOptions(optionValues: Record<string, string>): string {
  const parts = Object.keys(optionValues)
    .sort()
    .map((k) => `${k}-${optionValues[k]}`);
  const id = slugify(parts.join("-"));
  return id || "default";
}

/** Cartesian product of option axes (max 2). */
export function expandOptionCombos(
  options: Array<{ name: string; values: string[] }>,
): Array<Record<string, string>> {
  if (options.length === 0) return [{}];
  let combos: Array<Record<string, string>> = [{}];
  for (const opt of options) {
    const next: Array<Record<string, string>> = [];
    for (const combo of combos) {
      for (const value of opt.values) {
        next.push({ ...combo, [opt.name]: value });
      }
    }
    combos = next;
  }
  return combos;
}

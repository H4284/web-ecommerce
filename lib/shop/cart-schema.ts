import { z } from "zod";

/** Shared cart line input (validate + checkout). */
export const cartLineInputSchema = z.object({
  variantId: z.string().min(1),
  productId: z.string().min(1),
  qty: z.number().int().min(1).max(99),
});

export const cartValidateBodySchema = z.object({
  lines: z.array(cartLineInputSchema).max(50),
  discountCode: z.string().trim().min(1).max(40).nullable().optional(),
});

export type CartLineInput = z.infer<typeof cartLineInputSchema>;
export type CartValidateBody = z.infer<typeof cartValidateBodySchema>;

/** Merge duplicate variantIds by summing qty (before stock clamp). */
export function mergeCartLines(lines: CartLineInput[]): CartLineInput[] {
  const map = new Map<string, CartLineInput>();
  for (const line of lines) {
    const existing = map.get(line.variantId);
    if (existing) {
      existing.qty += line.qty;
    } else {
      map.set(line.variantId, { ...line });
    }
  }
  return [...map.values()];
}

import { z } from "zod";
import { shopCopy } from "@/content/shop";

export const discountSchema = z.object({
  type: z.enum(["percent", "fixed", "free_delivery"]),
  value: z.number().int().nonnegative(),
  minSubtotalCents: z.number().int().nonnegative(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  usageLimit: z.number().int().positive().nullable(),
  usedCount: z.number().int().nonnegative(),
  active: z.boolean(),
});

export type DiscountDoc = z.infer<typeof discountSchema>;

export type DiscountResult = {
  code: string | null;
  type: DiscountDoc["type"] | null;
  amountCents: number;
  freeDelivery: boolean;
  message: string | null;
};

function parseInstant(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : NaN;
}

/** Pure discount check + amount. Amounts are whole cents only. */
export function evaluateDiscount(
  code: string | null | undefined,
  discount: DiscountDoc | null,
  subtotalCents: number,
  now: Date = new Date(),
): DiscountResult {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) {
    throw new Error("subtotalCents must be a non-negative integer");
  }

  const empty: DiscountResult = {
    code: null,
    type: null,
    amountCents: 0,
    freeDelivery: false,
    message: null,
  };

  if (!code) return empty;

  const normalized = code.trim().toUpperCase();
  if (!discount || !discount.active) {
    return { ...empty, message: shopCopy.discountInvalid };
  }

  const start = parseInstant(discount.startsAt);
  const end = parseInstant(discount.endsAt);
  const t = now.getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || t < start || t > end) {
    return { ...empty, message: shopCopy.discountExpired };
  }

  if (subtotalCents < discount.minSubtotalCents) {
    return { ...empty, message: shopCopy.discountMinimum };
  }

  if (discount.usageLimit != null && discount.usedCount >= discount.usageLimit) {
    return { ...empty, message: shopCopy.discountLimit };
  }

  if (discount.type === "percent") {
    const amountCents = Math.round((subtotalCents * discount.value) / 100);
    return {
      code: normalized,
      type: "percent",
      amountCents: Math.min(subtotalCents, Math.max(0, amountCents)),
      freeDelivery: false,
      message: null,
    };
  }

  if (discount.type === "fixed") {
    const amountCents = Math.min(subtotalCents, Math.max(0, discount.value));
    return {
      code: normalized,
      type: "fixed",
      amountCents,
      freeDelivery: false,
      message: null,
    };
  }

  return {
    code: normalized,
    type: "free_delivery",
    amountCents: 0,
    freeDelivery: true,
    message: null,
  };
}

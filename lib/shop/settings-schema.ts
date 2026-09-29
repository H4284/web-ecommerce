import { z } from "zod";

export const deliveryMethodSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
  freeOverCents: z.number().int().nonnegative().nullable(),
  days: z.string().min(1),
  active: z.boolean(),
});

export const paymentMethodSchema = z.object({
  id: z.enum(["cod", "transfer", "bank-card"]),
  label: z.string().min(1),
  description: z.string(),
  active: z.boolean(),
  order: z.number().int(),
});

export const shopSettingsSchema = z.object({
  deliveryMethods: z.array(deliveryMethodSchema).min(1),
  paymentMethods: z.array(paymentMethodSchema).min(1),
  orderPrefix: z.string().min(2).max(4),
  ordersInbox: z.string().email(),
  company: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().min(1),
    iban: z.string(),
  }),
});

export type DeliveryMethod = z.infer<typeof deliveryMethodSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type ShopSettings = z.infer<typeof shopSettingsSchema>;

/** Free delivery when subtotal is ≥ freeOverCents (inclusive). */
export function qualifiesForFreeDelivery(
  subtotalCents: number,
  method: Pick<DeliveryMethod, "freeOverCents">,
): boolean {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) {
    throw new Error("qualifiesForFreeDelivery: subtotalCents must be a non-negative integer");
  }
  if (method.freeOverCents == null) return false;
  return subtotalCents >= method.freeOverCents;
}

/** Delivery fee in cents from settings — never hardcode fees in callers. */
export function deliveryFeeCents(
  subtotalCents: number,
  method: Pick<DeliveryMethod, "priceCents" | "freeOverCents">,
): number {
  if (qualifiesForFreeDelivery(subtotalCents, method)) return 0;
  return method.priceCents;
}

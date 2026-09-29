import { z } from "zod";
import { isKosovoCity } from "@/lib/shop/cities";
import { isValidKosovoPhone, normalizeKosovoPhone } from "@/lib/shop/phone";

const phoneSchema = z
  .string()
  .trim()
  .refine((v) => isValidKosovoPhone(v), { message: "phone" });

export const checkoutAddressSchema = z.object({
  country: z.literal("XK"),
  city: z
    .string()
    .min(1, { message: "city" })
    .refine((v): boolean => isKosovoCity(v), { message: "city" }),
  recipient: z.string().trim().min(2, { message: "recipient" }).max(80),
  address: z.string().trim().min(3, { message: "address" }).max(160),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  phone: phoneSchema,
});

export type CheckoutAddress = z.infer<typeof checkoutAddressSchema>;

/**
 * Shared checkout form schema (client + future POST /api/orders).
 * Phone must be +383 and 8 digits (spaces allowed).
 */
export const checkoutFormSchema = z
  .object({
    email: z.string().trim().email({ message: "email" }).max(120),
    delivery: checkoutAddressSchema,
    billingSameAsDelivery: z.boolean(),
    billing: checkoutAddressSchema.optional(),
    deliveryMethodId: z.string().min(1, { message: "deliveryMethod" }),
    paymentMethodId: z.enum(["cod", "transfer", "bank-card"]),
    newsletterOptIn: z.boolean(),
    termsAccepted: z.boolean().refine((v) => v === true, { message: "terms" }),
    /** Honeypot — must stay empty. */
    website: z.string().optional(),
    turnstileToken: z.string().min(1, { message: "turnstile" }),
  })
  .superRefine((data, ctx) => {
    if (data.website && data.website.length > 0) {
      ctx.addIssue({ code: "custom", message: "honeypot", path: ["website"] });
    }
    if (!data.billingSameAsDelivery && !data.billing) {
      ctx.addIssue({ code: "custom", message: "billing", path: ["billing"] });
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export const CHECKOUT_DRAFT_KEY = "checkout_draft_v1";

export function emptyAddress(): CheckoutFormValues["delivery"] {
  return {
    country: "XK",
    city: "",
    recipient: "",
    address: "",
    postalCode: "",
    phone: "",
  };
}

/** Normalize phones and strip empty postal codes before the order route. */
export function toNormalizedCheckoutPayload(values: CheckoutFormValues) {
  const deliveryPhone = normalizeKosovoPhone(values.delivery.phone)!;
  const delivery = {
    ...values.delivery,
    phone: deliveryPhone,
    postalCode: values.delivery.postalCode?.trim() || undefined,
  };

  const billingSource = values.billingSameAsDelivery
    ? values.delivery
    : values.billing!;
  const billingPhone = normalizeKosovoPhone(billingSource.phone)!;
  const billing = {
    ...billingSource,
    phone: billingPhone,
    postalCode: billingSource.postalCode?.trim() || undefined,
  };

  return {
    email: values.email.trim(),
    delivery,
    billing,
    billingSameAsDelivery: values.billingSameAsDelivery,
    deliveryMethodId: values.deliveryMethodId,
    paymentMethodId: values.paymentMethodId,
    newsletterOptIn: values.newsletterOptIn,
    termsAccepted: true as const,
    turnstileToken: values.turnstileToken,
    website: "",
  };
}

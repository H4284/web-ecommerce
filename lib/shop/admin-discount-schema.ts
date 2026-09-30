import { z } from "zod";
import { discountSchema, type DiscountDoc } from "@/lib/shop/discounts";

export type AdminDiscount = DiscountDoc & { code: string };

/** Document id = uppercase code. */
export const discountCodeSchema = z
  .string()
  .trim()
  .min(2)
  .max(32)
  .regex(/^[A-Za-z0-9_-]+$/)
  .transform((s) => s.toUpperCase());

export const saveDiscountInputSchema = z
  .object({
    code: discountCodeSchema,
    type: discountSchema.shape.type,
    value: z.number().int().nonnegative(),
    minSubtotalCents: z.number().int().nonnegative(),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    usageLimit: z.number().int().positive().nullable(),
    active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const start = Date.parse(data.startsAt);
    const end = Date.parse(data.endsAt);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      ctx.addIssue({
        code: "custom",
        message: "invalid_dates",
        path: ["startsAt"],
      });
    } else if (end <= start) {
      ctx.addIssue({
        code: "custom",
        message: "ends_before_start",
        path: ["endsAt"],
      });
    }
    if (data.type === "percent" && (data.value < 1 || data.value > 100)) {
      ctx.addIssue({
        code: "custom",
        message: "percent_range",
        path: ["value"],
      });
    }
    if (data.type === "free_delivery" && data.value !== 0) {
      ctx.addIssue({
        code: "custom",
        message: "free_delivery_value",
        path: ["value"],
      });
    }
  });

export type SaveDiscountInput = z.infer<typeof saveDiscountInputSchema>;

export const setDiscountActiveInputSchema = z.object({
  code: discountCodeSchema,
  active: z.boolean(),
});

export type SetDiscountActiveInput = z.infer<typeof setDiscountActiveInputSchema>;

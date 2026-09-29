import { z } from "zod";
import { cartLineInputSchema } from "@/lib/shop/cart-schema";
import { checkoutFormSchema } from "@/lib/shop/checkout-schema";

/** POST /api/orders body — checkout fields + cart lines. */
export const createOrderBodySchema = checkoutFormSchema.and(
  z.object({
    lines: z.array(cartLineInputSchema).min(1).max(50),
    discountCode: z.string().trim().min(1).max(40).nullable().optional(),
  }),
);

export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;

export type OrderSuccessResponse = {
  orderId: string;
  number: string;
  thankYouUrl: string;
};

export type OrderStockConflict = {
  error: "stock";
  sku: string;
  available: number;
  message: string;
};

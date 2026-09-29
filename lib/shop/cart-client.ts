import type { CartLine } from "@/stores/cart";

export type CartDiscountResult = {
  code: string | null;
  type: "percent" | "fixed" | "free_delivery" | null;
  amountCents: number;
  freeDelivery: boolean;
  message: string | null;
};

export type CartValidateResponse = {
  lines: CartLine[];
  messages: string[];
  subtotalCents: number;
  discount: CartDiscountResult;
  deliveryMethods: Array<{
    id: string;
    label: string;
    priceCents: number;
    freeOverCents: number | null;
    days: string;
    active: boolean;
  }>;
};

type ValidateInput = {
  lines: Array<{ variantId: string; productId: string; qty: number }>;
  discountCode?: string | null;
};

/** POST /api/cart/validate — client helper. */
export async function postCartValidate(
  input: ValidateInput,
): Promise<CartValidateResponse> {
  const res = await fetch("/api/cart/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lines: input.lines,
      discountCode: input.discountCode ?? null,
    }),
  });
  if (!res.ok) {
    throw new Error(`Cart validate failed (${res.status})`);
  }
  return (await res.json()) as CartValidateResponse;
}

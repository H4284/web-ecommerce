import { describe, expect, it } from "vitest";
import { shopCopy } from "@/content/shop";
import { formatCents } from "@/lib/shop/money";
import { freeDeliveryRemainingCents } from "@/stores/cart";

/** Progress copy helper — keeps 2-decimal amounts and the exact threshold switch. */
function freeDeliveryMessage(
  subtotal: number,
  freeOverCents: number | null,
  discountFreeDelivery = false,
): string | null {
  if (freeOverCents == null && !discountFreeDelivery) return null;
  const remaining =
    freeOverCents == null
      ? 0
      : freeDeliveryRemainingCents(subtotal, freeOverCents);
  const reached = discountFreeDelivery || remaining === 0;
  if (reached) return shopCopy.cartFreeDeliveryReached;
  return shopCopy.cartFreeDeliveryAdd.replace("{amount}", formatCents(remaining));
}

describe("free delivery progress copy", () => {
  it("shows remaining with two decimals below the threshold", () => {
    expect(freeDeliveryMessage(2200, 5000)).toBe(
      shopCopy.cartFreeDeliveryAdd.replace("{amount}", formatCents(2800)),
    );
  });

  it("switches to the success text exactly at the threshold", () => {
    expect(freeDeliveryMessage(4999, 5000)).toContain(formatCents(1));
    expect(freeDeliveryMessage(5000, 5000)).toBe(shopCopy.cartFreeDeliveryReached);
    expect(freeDeliveryMessage(5001, 5000)).toBe(shopCopy.cartFreeDeliveryReached);
  });
});

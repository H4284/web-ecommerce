import { describe, expect, it } from "vitest";
import { cartValidateBodySchema, mergeCartLines } from "@/lib/shop/cart-schema";
import { evaluateDiscount, type DiscountDoc } from "@/lib/shop/discounts";
import { shopCopy } from "@/content/shop";

const now = new Date("2026-09-29T12:00:00.000Z");

function baseDiscount(partial: Partial<DiscountDoc> = {}): DiscountDoc {
  return {
    type: "percent",
    value: 10,
    minSubtotalCents: 0,
    startsAt: "2026-01-01T00:00:00.000Z",
    endsAt: "2027-01-01T00:00:00.000Z",
    usageLimit: null,
    usedCount: 0,
    active: true,
    ...partial,
  };
}

describe("cart-schema", () => {
  it("rejects qty -1, 0 and 0.5", () => {
    for (const qty of [-1, 0, 0.5]) {
      const result = cartValidateBodySchema.safeParse({
        lines: [{ variantId: "v1", productId: "p1", qty }],
      });
      expect(result.success).toBe(false);
    }
  });

  it("merges the same variantId into one line", () => {
    const merged = mergeCartLines([
      { variantId: "v1", productId: "p1", qty: 2 },
      { variantId: "v1", productId: "p1", qty: 3 },
      { variantId: "v2", productId: "p1", qty: 1 },
    ]);
    expect(merged).toEqual([
      { variantId: "v1", productId: "p1", qty: 5 },
      { variantId: "v2", productId: "p1", qty: 1 },
    ]);
  });
});

describe("evaluateDiscount", () => {
  it("rounds percent to whole cents", () => {
    const result = evaluateDiscount("SAVE10", baseDiscount({ type: "percent", value: 10 }), 1999, now);
    expect(result.amountCents).toBe(200);
    expect(result.message).toBeNull();
  });

  it("never lets fixed go below 0 or above subtotal", () => {
    expect(
      evaluateDiscount("FIX", baseDiscount({ type: "fixed", value: 5000 }), 1200, now).amountCents,
    ).toBe(1200);
    expect(
      evaluateDiscount("FIX", baseDiscount({ type: "fixed", value: 0 }), 1200, now).amountCents,
    ).toBe(0);
  });

  it("applies free delivery without amount", () => {
    const result = evaluateDiscount(
      "FREE",
      baseDiscount({ type: "free_delivery", value: 0 }),
      3000,
      now,
    );
    expect(result.freeDelivery).toBe(true);
    expect(result.amountCents).toBe(0);
  });

  it("returns the four failure messages", () => {
    expect(evaluateDiscount("X", null, 1000, now).message).toBe(shopCopy.discountInvalid);
    expect(
      evaluateDiscount(
        "OLD",
        baseDiscount({ endsAt: "2020-01-01T00:00:00.000Z" }),
        1000,
        now,
      ).message,
    ).toBe(shopCopy.discountExpired);
    expect(
      evaluateDiscount(
        "MIN",
        baseDiscount({ minSubtotalCents: 5000 }),
        1000,
        now,
      ).message,
    ).toBe(shopCopy.discountMinimum);
    expect(
      evaluateDiscount(
        "LIM",
        baseDiscount({ usageLimit: 2, usedCount: 2 }),
        1000,
        now,
      ).message,
    ).toBe(shopCopy.discountLimit);
  });
});

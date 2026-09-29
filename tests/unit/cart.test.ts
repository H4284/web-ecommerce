import { beforeEach, describe, expect, it } from "vitest";
import {
  freeDeliveryRemainingCents,
  itemCount,
  resetCartStore,
  subtotalCents,
  useCartStore,
  type CartLine,
} from "@/stores/cart";

function line(partial: Partial<CartLine> & Pick<CartLine, "variantId">): CartLine {
  return {
    productId: "prod-01",
    productSlug: "qelibar",
    sku: `SKU-${partial.variantId}`,
    name: "Qelibar",
    variantLabel: "50 ml",
    imagePath: "products/prod-01/0",
    priceCents: 4200,
    compareAtCents: null,
    qty: 1,
    maxQty: 5,
    ...partial,
  };
}

beforeEach(() => {
  resetCartStore();
});

describe("cart store actions", () => {
  it("merges the same variant into one line with qty 2", () => {
    const base = line({ variantId: "v-50" });
    useCartStore.getState().add(base);
    useCartStore.getState().add(base);
    const { lines } = useCartStore.getState();
    expect(lines).toHaveLength(1);
    expect(lines[0]?.qty).toBe(2);
    expect(itemCount(lines)).toBe(2);
  });

  it("keeps two variants of one product as two lines", () => {
    useCartStore.getState().add(line({ variantId: "v-50", variantLabel: "50 ml" }));
    useCartStore.getState().add(
      line({ variantId: "v-100", variantLabel: "100 ml", priceCents: 7000 }),
    );
    const { lines } = useCartStore.getState();
    expect(lines).toHaveLength(2);
    expect(itemCount(lines)).toBe(2);
    expect(subtotalCents(lines)).toBe(4200 + 7000);
  });

  it("clamps setQty between 1 and maxQty", () => {
    useCartStore.getState().add(line({ variantId: "v-50", maxQty: 3 }));
    useCartStore.getState().setQty("v-50", 99);
    expect(useCartStore.getState().lines[0]?.qty).toBe(3);
    useCartStore.getState().setQty("v-50", 0);
    expect(useCartStore.getState().lines[0]?.qty).toBe(1);
  });

  it("removes a line and restores it", () => {
    useCartStore.getState().add(line({ variantId: "v-50" }));
    useCartStore.getState().remove("v-50");
    expect(useCartStore.getState().lines).toHaveLength(0);
    expect(useCartStore.getState().lastRemoved?.variantId).toBe("v-50");
    useCartStore.getState().restore();
    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(useCartStore.getState().lastRemoved).toBeNull();
  });

  it("clears lines, discount, and undo buffer", () => {
    useCartStore.getState().add(line({ variantId: "v-50" }));
    useCartStore.getState().setDiscountCode("SAVE10");
    useCartStore.getState().remove("v-50");
    useCartStore.getState().clear();
    const state = useCartStore.getState();
    expect(state.lines).toEqual([]);
    expect(state.discountCode).toBeNull();
    expect(state.lastRemoved).toBeNull();
  });

  it("applyServerLines replaces client lines with server values", () => {
    useCartStore.getState().add(line({ variantId: "v-50", priceCents: 4200 }));
    useCartStore.getState().applyServerLines([
      line({ variantId: "v-50", priceCents: 4500, qty: 2, maxQty: 4 }),
    ]);
    const { lines } = useCartStore.getState();
    expect(lines).toHaveLength(1);
    expect(lines[0]?.priceCents).toBe(4500);
    expect(lines[0]?.qty).toBe(2);
  });

  it("rejects non-integer money or qty", () => {
    expect(() =>
      useCartStore.getState().add(line({ variantId: "v-50", priceCents: 12.5 })),
    ).toThrow(/integer/);
    useCartStore.getState().add(line({ variantId: "v-50" }));
    expect(() => useCartStore.getState().setQty("v-50", 1.5)).toThrow(/integer/);
  });
});

describe("cart selectors", () => {
  it("computes itemCount and subtotalCents with integers only", () => {
    const lines = [
      line({ variantId: "a", qty: 2, priceCents: 1000 }),
      line({ variantId: "b", qty: 1, priceCents: 2500 }),
    ];
    expect(itemCount(lines)).toBe(3);
    expect(subtotalCents(lines)).toBe(4500);
  });

  it("computes free delivery remaining cents", () => {
    expect(freeDeliveryRemainingCents(3000, 5000)).toBe(2000);
    expect(freeDeliveryRemainingCents(5000, 5000)).toBe(0);
    expect(freeDeliveryRemainingCents(6000, 5000)).toBe(0);
    expect(freeDeliveryRemainingCents(1000, null)).toBe(0);
  });
});

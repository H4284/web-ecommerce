import { describe, expect, it } from "vitest";
import {
  findVariant,
  initialSelectionFromSku,
  isOptionValueAvailable,
  variantTitleSuffix,
} from "@/lib/shop/variants";
import type { ProductOption, Variant } from "@/lib/shop/schemas";

const options: ProductOption[] = [
  { name: "size", values: ["50 ml", "100 ml"] },
  { name: "concentration", values: ["EDP", "Extrait"] },
];

function v(
  id: string,
  size: string,
  concentration: string,
  stock = 2,
): Variant & { id: string } {
  return {
    id,
    sku: `SKU-${id}`,
    optionValues: { size, concentration },
    priceCents: 5000,
    compareAtCents: null,
    stock,
    isDefault: id === "a",
  };
}

const variants = [
  v("a", "50 ml", "EDP"),
  v("b", "50 ml", "Extrait"),
  v("c", "100 ml", "EDP"),
  // no 100 ml + Extrait
];

describe("variants", () => {
  it("finds an exact match", () => {
    const found = findVariant(variants, { size: "50 ml", concentration: "Extrait" }, [
      "size",
      "concentration",
    ]);
    expect(found?.id).toBe("b");
  });

  it("disables impossible combinations", () => {
    const selection = { size: "100 ml", concentration: "EDP" };
    expect(isOptionValueAvailable(variants, "concentration", "Extrait", selection)).toBe(
      false,
    );
    expect(isOptionValueAvailable(variants, "concentration", "EDP", selection)).toBe(true);
  });

  it("keeps other-axis values available when switching", () => {
    const selection = { size: "50 ml", concentration: "EDP" };
    expect(isOptionValueAvailable(variants, "size", "100 ml", selection)).toBe(true);
  });

  it("hydrates selection from sku", () => {
    const { selection, variant } = initialSelectionFromSku(
      variants,
      options,
      "SKU-c",
      "a",
    );
    expect(variant?.id).toBe("c");
    expect(selection).toEqual({ size: "100 ml", concentration: "EDP" });
    expect(variantTitleSuffix(options, selection)).toBe("100 ml / EDP");
  });
});

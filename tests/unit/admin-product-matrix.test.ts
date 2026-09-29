import { describe, expect, it } from "vitest";
import {
  expandOptionCombos,
  variantIdFromOptions,
} from "@/lib/shop/admin-product-schema";

describe("admin product variant matrix", () => {
  it("builds 2×2 = 4 combos", () => {
    const combos = expandOptionCombos([
      { name: "Aroma", values: ["Iris", "Oud"] },
      { name: "Madhësia", values: ["50 ml", "100 ml"] },
    ]);
    expect(combos).toHaveLength(4);
    expect(combos).toContainEqual({ Aroma: "Iris", Madhësia: "50 ml" });
    expect(combos).toContainEqual({ Aroma: "Oud", Madhësia: "100 ml" });
  });

  it("makes stable variant ids", () => {
    const a = variantIdFromOptions({ Madhësia: "50 ml", Aroma: "Iris" });
    const b = variantIdFromOptions({ Aroma: "Iris", Madhësia: "50 ml" });
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from "vitest";
import {
  brandSchema,
  categorySchema,
  productSchema,
  variantSchema,
} from "@/lib/shop/schemas";
import {
  SEED_DUAL_AXIS_COUNT,
  SEED_PRODUCT_COUNT,
  buildSeedBrand,
  buildSeedCategories,
  buildSeedProducts,
  seedExpectedCounts,
} from "@/lib/shop/seed-catalog";

describe("seed catalog shape", () => {
  it("matches plan categories and 20 products with 5 dual-axis", () => {
    const counts = seedExpectedCounts();
    expect(counts.categories).toBe(4);
    expect(counts.brands).toBe(1);
    expect(counts.products).toBe(SEED_PRODUCT_COUNT);
    expect(counts.dualAxis).toBe(SEED_DUAL_AXIS_COUNT);
    expect(counts.dualAxis).toBeGreaterThanOrEqual(5);
  });

  it("parses every seed document with unit-1 schemas", () => {
    for (const cat of buildSeedCategories()) {
      const { id, ...data } = cat;
      void id;
      expect(() => categorySchema.parse(data)).not.toThrow();
    }
    const { id: brandId, ...brand } = buildSeedBrand();
    void brandId;
    expect(() => brandSchema.parse(brand)).not.toThrow();

    for (const item of buildSeedProducts()) {
      for (const v of item.variants) {
        const { id: variantId, ...data } = v;
        void variantId;
        expect(() => variantSchema.parse(data)).not.toThrow();
      }
      expect(item.variants.length).toBeGreaterThanOrEqual(
        item.product.options.length === 2 ? 4 : 2,
      );
      expect(() =>
        productSchema.parse({
          ...item.product,
          images: [{ path: `products/${item.id}/0`, alt: item.imageAlt }],
          searchTokens: ["sa"],
          minPriceCents: 100,
          maxPriceCents: 200,
          totalStock: 1,
          defaultVariantId: item.variants[0]!.id,
        }),
      ).not.toThrow();
    }
  });
});

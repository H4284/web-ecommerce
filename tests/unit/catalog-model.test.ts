import { describe, expect, it } from "vitest";
import { formatCents, unitPrice } from "@/lib/shop/money";
import {
  brandSchema,
  categorySchema,
  productSchema,
  variantSchema,
} from "@/lib/shop/schemas";
import { searchTokens } from "@/lib/shop/search";
import { slugify } from "@/lib/shop/slug";

const validCategory = {
  name: "Women",
  slug: "women",
  parentId: "perfumes",
  order: 1,
  isActive: true,
  image: null,
  seo: { title: "Women" },
};

const validBrand = {
  name: "Sanem",
  slug: "sanem",
  logo: null,
  isActive: true,
};

const validProduct = {
  name: "Noir",
  slug: "noir",
  brandId: "sanem",
  categoryIds: ["women"],
  shortDescription: "A calm evening scent.",
  description: "## Story\nQuiet luxury.",
  images: [{ path: "products/noir/0", alt: "Noir bottle" }],
  options: [{ name: "size", values: ["50 ml", "100 ml"] }],
  status: "active" as const,
  isNew: true,
  isBestSeller: false,
  unit: null,
  relatedIds: [],
  searchTokens: ["no", "noi", "noir"],
  minPriceCents: 4500,
  maxPriceCents: 7800,
  totalStock: 12,
  defaultVariantId: "noir-50",
  createdAt: "2026-09-29T10:00:00.000Z",
  updatedAt: "2026-09-29T10:00:00.000Z",
};

const validVariant = {
  sku: "NOIR-50",
  optionValues: { size: "50 ml" },
  priceCents: 4500,
  compareAtCents: 5200,
  stock: 5,
  isDefault: true,
  image: null,
};

describe("catalog schemas", () => {
  it("accepts 3 valid documents", () => {
    expect(categorySchema.parse(validCategory).slug).toBe("women");
    expect(productSchema.parse(validProduct).name).toBe("Noir");
    expect(variantSchema.parse(validVariant).sku).toBe("NOIR-50");
  });

  it("rejects a category with an invalid slug", () => {
    const result = categorySchema.safeParse({ ...validCategory, slug: "Women!" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/slug/i);
    }
  });

  it("rejects a product with more than 2 option axes", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      options: [
        { name: "size", values: ["50 ml"] },
        { name: "concentration", values: ["EDP"] },
        { name: "pack", values: ["box"] },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/at most 2|too big|max/i);
    }
  });

  it("rejects a product with an empty categoryIds list", () => {
    const result = productSchema.safeParse({ ...validProduct, categoryIds: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message.length).toBeGreaterThan(0);
    }
  });

  it("rejects a variant with a float price", () => {
    const result = variantSchema.safeParse({ ...validVariant, priceCents: 45.5 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/int/i);
    }
  });

  it("rejects a brand with an empty name", () => {
    const result = brandSchema.safeParse({ ...validBrand, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message.length).toBeGreaterThan(0);
    }
  });

  it("rejects a product with an unknown status", () => {
    const result = productSchema.safeParse({ ...validProduct, status: "live" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message.length).toBeGreaterThan(0);
    }
  });
});

describe("slugify", () => {
  it('maps Albanian letters in "Kreatinë & Performancë"', () => {
    expect(slugify("Kreatinë & Performancë")).toBe("kreatine-performance");
  });

  it("maps ç and collapses punctuation", () => {
    expect(slugify("Çaj i detit")).toBe("caj-i-detit");
  });
});

describe("formatCents / unitPrice", () => {
  it("formats 2200 as plan EUR", () => {
    expect(formatCents(2200)).toBe("22,00 €");
  });

  it("computes unit price with integer maths", () => {
    expect(unitPrice(2200, { amount: 100, label: "g" })).toBe("0,22 €/g");
  });
});

describe("searchTokens", () => {
  it("builds prefixes 2–15 chars without diacritics", () => {
    const tokens = searchTokens("Kreatinë", "Sanem");
    expect(tokens).toContain("kr");
    expect(tokens).toContain("kreatine");
    expect(tokens).toContain("sa");
    expect(tokens).toContain("sanem");
    expect(tokens.every((t) => t.length >= 2 && t.length <= 15)).toBe(true);
    expect(tokens.every((t) => /^[a-z0-9]+$/.test(t))).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { categoryChips, resolveCategoryContext } from "@/lib/shop/category-context";
import type { CategoryDoc, CategoryTreeNode } from "@/lib/shop/catalog-queries";
import { parsePage, parseProductSort } from "@/lib/shop/product-sort";

function cat(
  partial: Pick<CategoryDoc, "id" | "name" | "slug" | "parentId" | "order">,
): CategoryDoc {
  return { ...partial, isActive: true, image: null, seo: { title: partial.name } };
}

const women = cat({ id: "women", name: "Women", slug: "women", parentId: "perfumes", order: 1 });
const men = cat({ id: "men", name: "Men", slug: "men", parentId: "perfumes", order: 2 });
const perfumes: CategoryTreeNode = {
  ...cat({ id: "perfumes", name: "Perfumes", slug: "perfumes", parentId: null, order: 0 }),
  children: [women, men],
};

describe("category-context", () => {
  it("exposes children chips on a root category", () => {
    const ctx = resolveCategoryContext([perfumes], perfumes);
    expect(categoryChips(ctx).map((c) => c.slug)).toEqual(["perfumes", "women", "men"]);
  });

  it("exposes parent + siblings on a child category", () => {
    const ctx = resolveCategoryContext([perfumes], women);
    expect(ctx.parent?.slug).toBe("perfumes");
    expect(categoryChips(ctx).map((c) => c.slug)).toEqual(["perfumes", "women", "men"]);
  });
});

describe("product-sort parsers", () => {
  it("parses sort and page safely", () => {
    expect(parseProductSort("price-asc")).toBe("price-asc");
    expect(parseProductSort("nope")).toBe("newest");
    expect(parsePage("2")).toBe(2);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("x")).toBe(1);
  });
});

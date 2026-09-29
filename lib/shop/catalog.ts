import "server-only";
import { unstable_cache } from "next/cache";
import * as queries from "@/lib/shop/catalog-queries";
import type { ListProductsInput, ProductDoc } from "@/lib/shop/catalog-queries";

const REVALIDATE = 300;
const TAG = "catalog" as const;

export async function getCategoryTree() {
  return unstable_cache(() => queries.getCategoryTree(), ["catalog", "category-tree"], {
    revalidate: REVALIDATE,
    tags: [TAG],
  })();
}

export async function getCategoryBySlug(slug: string) {
  return unstable_cache(() => queries.getCategoryBySlug(slug), ["catalog", "category-by-slug", slug], {
    revalidate: REVALIDATE,
    tags: [TAG],
  })();
}

export async function getBrandBySlug(slug: string) {
  return unstable_cache(() => queries.getBrandBySlug(slug), ["catalog", "brand-by-slug", slug], {
    revalidate: REVALIDATE,
    tags: [TAG],
  })();
}

export async function getProductBySlug(slug: string) {
  return unstable_cache(() => queries.getProductBySlug(slug), ["catalog", "product-by-slug", slug], {
    revalidate: REVALIDATE,
    tags: [TAG],
  })();
}

export async function listProducts(input: ListProductsInput = {}) {
  const key = JSON.stringify(input);
  return unstable_cache(() => queries.listProducts(input), ["catalog", "list-products", key], {
    revalidate: REVALIDATE,
    tags: [TAG],
  })();
}

export async function searchProducts(q: string, limit = 8) {
  return unstable_cache(
    () => queries.searchProducts(q, limit),
    ["catalog", "search-products", q, String(limit)],
    { revalidate: REVALIDATE, tags: [TAG] },
  )();
}

export async function getRelated(product: ProductDoc, limit = 8) {
  return unstable_cache(
    () => queries.getRelated(product, limit),
    ["catalog", "related", product.id, String(limit)],
    { revalidate: REVALIDATE, tags: [TAG] },
  )();
}

export async function getBestSellers(n = 8) {
  return unstable_cache(() => queries.getBestSellers(n), ["catalog", "best-sellers", String(n)], {
    revalidate: REVALIDATE,
    tags: [TAG],
  })();
}

export async function getNewProducts(n = 8) {
  return unstable_cache(() => queries.getNewProducts(n), ["catalog", "new-products", String(n)], {
    revalidate: REVALIDATE,
    tags: [TAG],
  })();
}

export async function getOffers(n = 8) {
  return unstable_cache(() => queries.getOffers(n), ["catalog", "offers", String(n)], {
    revalidate: REVALIDATE,
    tags: [TAG],
  })();
}

export type {
  BrandDoc,
  CategoryDoc,
  CategoryTreeNode,
  ListProductsInput,
  ProductDoc,
  ProductSort,
  ProductWithVariants,
  VariantDoc,
} from "@/lib/shop/catalog-queries";

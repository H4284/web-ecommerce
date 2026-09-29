import type { ProductSort } from "@/lib/shop/catalog-queries";
import { shopCopy } from "@/content/shop";

export const PRODUCT_SORTS: ProductSort[] = [
  "newest",
  "price-asc",
  "price-desc",
  "best-sellers",
];

export const productSortLabels: Record<ProductSort, string> = {
  newest: shopCopy.sortNewest,
  "price-asc": shopCopy.sortPriceAsc,
  "price-desc": shopCopy.sortPriceDesc,
  "best-sellers": shopCopy.sortBestSellers,
};

export function parseProductSort(value: string | undefined | null): ProductSort {
  if (value && (PRODUCT_SORTS as string[]).includes(value)) {
    return value as ProductSort;
  }
  return "newest";
}

export function parsePage(value: string | undefined | null): number {
  const n = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

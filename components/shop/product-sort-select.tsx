"use client";

import { useRouter } from "next/navigation";
import type { ProductSort } from "@/lib/shop/catalog-queries";
import { PRODUCT_SORTS, productSortLabels } from "@/lib/shop/product-sort";
import { shopCopy } from "@/content/shop";

type ProductSortSelectProps = {
  slug: string;
  sort: ProductSort;
};

export function ProductSortSelect({ slug, sort }: ProductSortSelectProps) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <span className="text-ink-muted">{shopCopy.sortLabel}</span>
      <select
        className="min-h-11 border border-border bg-surface px-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        value={sort}
        aria-label={shopCopy.sortLabel}
        onChange={(event) => {
          const next = event.target.value as ProductSort;
          const params = new URLSearchParams();
          if (next !== "newest") params.set("sort", next);
          const qs = params.toString();
          router.push(qs ? `/categories/${slug}?${qs}` : `/categories/${slug}`);
        }}
      >
        {PRODUCT_SORTS.map((value) => (
          <option key={value} value={value}>
            {productSortLabels[value]}
          </option>
        ))}
      </select>
    </label>
  );
}

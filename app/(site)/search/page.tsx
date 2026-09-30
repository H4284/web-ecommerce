import type { Metadata } from "next";
import Link from "next/link";
import { getCategoryTree, searchProducts } from "@/lib/shop/catalog";
import { categoryNavItems } from "@/lib/shop/nav";
import { ProductCard } from "@/components/shop/product-card";
import { site } from "@/content/site";
import { shopCopy } from "@/content/shop";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export const metadata: Metadata = {
  title: shopCopy.searchPageTitle,
  robots: { index: false, follow: false },
};

export default async function SearchPage({ searchParams }: PageProps) {
  const { q: raw = "" } = await searchParams;
  const q = raw.trim().slice(0, 50);
  const canSearch = q.length >= 2;

  const [products, tree] = await Promise.all([
    canSearch ? searchProducts(q, 48) : Promise.resolve([]),
    getCategoryTree(),
  ]);
  const categories = categoryNavItems(tree);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-[var(--space-section)] md:px-6">
      <div className="mb-[var(--space-8)] flex flex-col gap-3">
        <h1 className="font-display text-3xl tracking-display text-ink md:text-4xl">
          {shopCopy.searchPageTitle}
        </h1>
        {canSearch ? (
          <p className="text-sm text-ink-muted">
            “{q}” — {products.length} {shopCopy.resultCount}
          </p>
        ) : (
          <p className="text-sm text-ink-muted">{shopCopy.searchHint}</p>
        )}
      </div>

      {canSearch && products.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} brandName={site.name} />
            </li>
          ))}
        </ul>
      ) : null}

      {canSearch && products.length === 0 ? (
        <div className="flex flex-col items-start gap-6 py-[var(--space-8)]">
          <p className="text-ink-muted">{shopCopy.searchEmpty}</p>
          <CategoryBrowse categories={categories} />
        </div>
      ) : null}

      {!canSearch ? <CategoryBrowse categories={categories} /> : null}
    </div>
  );
}

function CategoryBrowse({
  categories,
}: {
  categories: Array<{ href: string; label: string }>;
}) {
  if (categories.length === 0) return null;
  return (
    <div>
      <p className="mb-3 text-sm text-ink-muted">{shopCopy.searchBrowseCategories}</p>
      <ul className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <li key={cat.href}>
            <Link
              href={cat.href}
              className="inline-flex min-h-11 items-center bg-surface-2 px-4 text-sm text-ink hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {cat.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

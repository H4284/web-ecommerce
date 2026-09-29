import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCategoryBySlug,
  getCategoryTree,
  listProducts,
} from "@/lib/shop/catalog";
import { categoryChips, resolveCategoryContext } from "@/lib/shop/category-context";
import { breadcrumbJsonLd } from "@/lib/shop/json-ld";
import { parsePage, parseProductSort } from "@/lib/shop/product-sort";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { CategoryChips } from "@/components/shop/category-chips";
import { Pagination } from "@/components/shop/pagination";
import { ProductCard } from "@/components/shop/product-card";
import { ProductSortSelect } from "@/components/shop/product-sort-select";
import { site } from "@/content/site";
import { shopCopy } from "@/content/shop";

const PAGE_SIZE = 12;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
};

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return { title: { absolute: `${site.chrome.notFoundTitle} | ${site.name}` }, robots: { index: false } };
  }

  const title = category.seo?.title ?? category.name;
  const description =
    category.seo?.description ?? `${category.name} — ${site.tagline}`;
  const canonical = `${siteUrl().replace(/\/$/, "")}/categories/${category.slug}`;

  return {
    title: { absolute: `${title} | ${site.name}` },
    description,
    alternates: { canonical },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const page = parsePage(query.page);
  const sort = parseProductSort(query.sort);

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [tree, listing] = await Promise.all([
    getCategoryTree(),
    listProducts({ categoryId: category.id, page, pageSize: PAGE_SIZE, sort }),
  ]);

  const ctx = resolveCategoryContext(tree, category);
  const chips = categoryChips(ctx);
  const pageCount = Math.max(1, Math.ceil(listing.total / listing.pageSize));

  if (page > pageCount && listing.total > 0) {
    notFound();
  }

  const crumbItems = [
    { label: shopCopy.breadcrumbHome, href: "/" },
    ...(ctx.parent
      ? [{ label: ctx.parent.name, href: `/categories/${ctx.parent.slug}` }]
      : []),
    { label: category.name },
  ];

  const ldCrumbs = [
    { name: shopCopy.breadcrumbHome, path: "/" },
    ...(ctx.parent
      ? [{ name: ctx.parent.name, path: `/categories/${ctx.parent.slug}` }]
      : []),
    { name: category.name, path: `/categories/${category.slug}` },
  ];

  const brandName = site.name;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-[var(--space-section)] md:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(ldCrumbs, siteUrl())),
        }}
      />

      <Breadcrumb items={crumbItems} className="mb-[var(--space-5)]" />

      <header className="mb-[var(--space-8)] flex flex-col gap-[var(--space-5)]">
        <h1 className="font-display text-3xl tracking-display text-ink md:text-4xl">
          {category.name}
        </h1>
        <CategoryChips chips={chips} activeSlug={category.slug} />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-ink-muted">
            {listing.total} {shopCopy.resultCount}
          </p>
          <ProductSortSelect slug={category.slug} sort={sort} />
        </div>
      </header>

      {listing.items.length === 0 ? (
        <p className="py-[var(--space-12)] text-center text-ink-muted">
          {shopCopy.emptyCategory}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {listing.items.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} brandName={brandName} />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        basePath={`/categories/${category.slug}`}
        page={listing.page}
        pageCount={pageCount}
        sort={sort}
      />
    </div>
  );
}

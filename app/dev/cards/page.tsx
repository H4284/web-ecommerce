import { notFound } from "next/navigation";
import { getBrandBySlug, getProductBySlug, listProducts } from "@/lib/shop/catalog";
import type { ProductCardModel } from "@/components/shop/product-card";
import { ProductCarousel } from "@/components/shop/product-carousel";
import { ProductGrid } from "@/components/shop/product-grid";

export const dynamic = "force-dynamic";

function variantLabel(
  optionValues: Record<string, string> | undefined,
): string | null {
  if (!optionValues) return null;
  const parts = Object.values(optionValues).filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : null;
}

async function loadCardModels(): Promise<ProductCardModel[]> {
  const [{ items }, brand] = await Promise.all([
    listProducts({ page: 1, pageSize: 24, sort: "newest" }),
    getBrandBySlug("sanem"),
  ]);

  const outOfStock = items.find((p) => p.totalStock === 0);
  const inStock = items.filter((p) => p.totalStock > 0);
  const picked = outOfStock
    ? [...inStock.slice(0, 7), outOfStock]
    : inStock.slice(0, 8);

  const cards: ProductCardModel[] = [];
  for (const product of picked) {
    const full = await getProductBySlug(product.slug);
    const def =
      full?.variants.find((v) => v.id === product.defaultVariantId) ??
      full?.variants.find((v) => v.isDefault) ??
      full?.variants[0];
    cards.push({
      product,
      brandName: brand?.name ?? null,
      variantLabel: variantLabel(def?.optionValues),
      compareAtCents: def?.compareAtCents ?? null,
    });
  }
  return cards;
}

export default async function DevCardsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const products = await loadCardModels();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl tracking-display text-ink">Product cards</h1>
        <p className="text-sm text-ink-muted">Dev-only grid and carousel from the seeded catalog.</p>
      </header>
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-ink">Grid</h2>
        <ProductGrid products={products} />
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-ink">Carousel</h2>
        <ProductCarousel products={products} />
      </section>
    </main>
  );
}

import type { ProductCardModel } from "@/components/shop/product-card";
import { ProductCarousel } from "@/components/shop/product-carousel";
import { shopCopy } from "@/content/shop";

type ProductRelatedProps = {
  products: ProductCardModel[];
};

/** Similar products carousel — hidden when empty (plan: related only). */
export function ProductRelated({ products }: ProductRelatedProps) {
  if (products.length === 0) return null;

  return (
    <section
      className="mt-[var(--space-12)] border-t border-border pt-[var(--space-10)]"
      aria-labelledby="related-products-heading"
    >
      <h2
        id="related-products-heading"
        className="mb-[var(--space-6)] font-display text-2xl tracking-display text-ink md:text-3xl"
      >
        {shopCopy.relatedHeading}
      </h2>
      <ProductCarousel products={products} />
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import type { ProductDoc } from "@/lib/shop/catalog-queries";
import { Price } from "@/components/shop/price";
import { StockBadge } from "@/components/shop/stock-badge";
import { shopCopy } from "@/content/shop";
import { cn } from "cn";

export type ProductCardModel = {
  product: ProductDoc;
  brandName?: string | null;
  variantLabel?: string | null;
  compareAtCents?: number | null;
};

type ProductCardProps = ProductCardModel & {
  className?: string;
  /** First viewport cards only — avoids competing LCP images. */
  priority?: boolean;
};

export function ProductCard({
  product,
  brandName,
  variantLabel,
  compareAtCents,
  className,
  priority = false,
}: ProductCardProps) {
  const primary = product.images[0];
  const secondary = product.images[1];
  const from = product.minPriceCents !== product.maxPriceCents;
  const inStock = product.totalStock > 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group flex flex-col gap-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        className,
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
        {primary ? (
          <Image
            src={primary.path}
            alt={primary.alt}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "object-cover transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out)]",
              secondary && "group-hover:opacity-0 max-lg:group-hover:opacity-100",
            )}
          />
        ) : null}
        {secondary ? (
          <Image
            src={secondary.path}
            alt={secondary.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover opacity-0 transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out)] max-lg:hidden lg:group-hover:opacity-100"
          />
        ) : null}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew ? (
            <span className="rounded-sm bg-surface/90 px-2 py-0.5 text-xs text-ink">
              {shopCopy.isNew}
            </span>
          ) : null}
          {product.isBestSeller ? (
            <span className="rounded-sm bg-surface/90 px-2 py-0.5 text-xs text-ink">
              {shopCopy.isBestSeller}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {brandName ? (
          <p className="text-xs tracking-wide text-ink-muted uppercase">{brandName}</p>
        ) : null}
        <p className="font-display text-lg tracking-display">{product.name}</p>
        {variantLabel ? (
          <p className="text-sm text-ink-muted">{variantLabel}</p>
        ) : null}
        <Price
          priceCents={product.minPriceCents}
          compareAtCents={compareAtCents}
          unit={product.unit}
          from={from}
        />
        <StockBadge inStock={inStock} />
        <span className="text-sm text-accent underline-offset-4 group-hover:underline">
          {shopCopy.selectOptions}
        </span>
      </div>
    </Link>
  );
}

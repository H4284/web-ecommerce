"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { ProductDoc, VariantDoc } from "@/lib/shop/catalog-queries";
import type { ProductOption, ProductUnit } from "@/lib/shop/schemas";
import {
  findVariant,
  initialSelectionFromSku,
  type OptionSelection,
  variantLabel,
  variantTitleSuffix,
} from "@/lib/shop/variants";
import { DeliveryBox } from "@/components/shop/delivery-box";
import { Price } from "@/components/shop/price";
import { ProductGallery } from "@/components/shop/product-gallery";
import { StockBadge } from "@/components/shop/stock-badge";
import { VariantSelector } from "@/components/shop/variant-selector";
import { useCartUi } from "@/components/shop/cart-ui";
import { shopCopy } from "@/content/shop";
import { useCartStore } from "@/stores/cart";

export type ProductCategoryLink = {
  name: string;
  slug: string;
};

type ProductViewProps = {
  product: ProductDoc;
  variants: VariantDoc[];
  options: ProductOption[];
  brandName: string | null;
  categories: ProductCategoryLink[];
  shopName: string;
  initialSku: string | null;
  delivery: {
    feeCents: number;
    freeOverCents: number | null;
    days: string;
    codLabel: string;
  };
};

export function ProductView({
  product,
  variants,
  options,
  brandName,
  categories,
  shopName,
  initialSku,
  delivery,
}: ProductViewProps) {
  const optionNames = useMemo(() => options.map((o) => o.name), [options]);
  const boot = useMemo(
    () =>
      initialSelectionFromSku(
        variants,
        options,
        initialSku,
        product.defaultVariantId,
      ),
    [variants, options, initialSku, product.defaultVariantId],
  );

  const [selection, setSelection] = useState<OptionSelection>(boot.selection);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const add = useCartStore((s) => s.add);
  const { openCart } = useCartUi();

  const variant = useMemo(
    () => findVariant(variants, selection, optionNames),
    [variants, selection, optionNames],
  );

  const syncUrlAndTitle = useCallback(
    (nextVariant: VariantDoc | null, nextSelection: OptionSelection) => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      if (nextVariant?.sku) {
        url.searchParams.set("variant", nextVariant.sku);
      } else {
        url.searchParams.delete("variant");
      }
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);

      const suffix = variantTitleSuffix(options, nextSelection);
      document.title = suffix
        ? `${product.name} - ${suffix} | ${shopName}`
        : `${product.name} | ${shopName}`;
    },
    [options, product.name, shopName],
  );

  useEffect(() => {
    syncUrlAndTitle(variant, selection);
  }, [variant, selection, syncUrlAndTitle]);

  function onOptionChange(optionName: string, value: string) {
    const next = { ...selection, [optionName]: value };
    setSelection(next);
  }

  function onAddToCart() {
    if (!variant || adding) return;
    const maxQty = Math.min(99, Math.max(0, variant.stock));
    if (maxQty <= 0) return;

    setAdding(true);
    try {
      add({
        variantId: variant.id,
        productId: product.id,
        productSlug: product.slug,
        sku: variant.sku,
        name: product.name,
        variantLabel: variantLabel(options, variant),
        imagePath: variant.image?.path ?? product.images[0]?.path ?? null,
        priceCents: variant.priceCents,
        compareAtCents: variant.compareAtCents ?? null,
        maxQty,
        qty,
      });
      toast.success(shopCopy.addToCartToast);
      openCart();
    } finally {
      setAdding(false);
    }
  }

  const activeImage =
    variant?.image?.path ?? product.images[0]?.path ?? null;
  const unit: ProductUnit | null | undefined = product.unit;
  const inStock = (variant?.stock ?? 0) > 0;
  const maxQty = Math.min(99, Math.max(1, variant?.stock ?? 1));

  return (
    <div className="grid gap-[var(--space-8)] lg:grid-cols-2 lg:gap-[var(--space-10)]">
      <ProductGallery
        images={product.images}
        activePath={activeImage}
        productName={product.name}
      />

      <div className="flex flex-col gap-[var(--space-5)]">
        {brandName ? (
          <p className="text-xs tracking-wide text-ink-muted uppercase">{brandName}</p>
        ) : null}
        <h1 className="font-display text-3xl tracking-display text-ink md:text-4xl">
          {product.name}
        </h1>
        {product.shortDescription ? (
          <p className="text-base text-ink-muted">{product.shortDescription}</p>
        ) : null}

        {variant ? (
          <Price
            priceCents={variant.priceCents}
            compareAtCents={variant.compareAtCents}
            unit={unit}
          />
        ) : null}

        <StockBadge inStock={inStock} />

        <VariantSelector
          options={options}
          variants={variants}
          selection={selection}
          onChange={onOptionChange}
        />

        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm text-ink">
            <span className="text-ink-muted">{shopCopy.quantity}</span>
            <input
              type="number"
              min={1}
              max={maxQty}
              value={qty}
              disabled={!inStock}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                if (!Number.isFinite(n)) return;
                setQty(Math.min(maxQty, Math.max(1, n)));
              }}
              className="min-h-11 w-20 border border-border bg-surface px-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>

          <button
            type="button"
            disabled={!inStock || !variant || adding}
            onClick={onAddToCart}
            className="min-h-11 min-w-[12rem] flex-1 bg-ink px-5 text-sm font-medium text-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
          >
            {adding ? shopCopy.addToCartAdding : shopCopy.addToCart}
          </button>
        </div>

        <DeliveryBox
          feeCents={delivery.feeCents}
          freeOverCents={delivery.freeOverCents}
          days={delivery.days}
          codLabel={delivery.codLabel}
        />

        {categories.length > 0 ? (
          <div>
            <p className="mb-2 text-sm text-ink-muted">{shopCopy.categoriesHeading}</p>
            <ul className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/categories/${cat.slug}`}
                    className="text-sm text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

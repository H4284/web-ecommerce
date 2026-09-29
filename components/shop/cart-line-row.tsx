"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { shopCopy } from "@/content/shop";
import { formatCents } from "@/lib/shop/money";
import { useCartStore, type CartLine } from "@/stores/cart";

type CartLineRowProps = {
  line: CartLine;
};

export function CartLineRow({ line }: CartLineRowProps) {
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const restore = useCartStore((s) => s.restore);

  function onRemove() {
    remove(line.variantId);
    toast(shopCopy.cartRemovedToast, {
      duration: 5000,
      action: {
        label: shopCopy.cartUndo,
        onClick: () => restore(),
      },
    });
  }

  function onQtyInput(raw: string) {
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return;
    setQty(line.variantId, n);
  }

  const lineTotal = line.priceCents * line.qty;

  return (
    <li className="flex gap-3 border-b border-border py-4 last:border-b-0">
      <Link
        href={`/products/${line.productSlug}`}
        className="relative size-20 shrink-0 overflow-hidden bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {line.imagePath ? (
          <Image
            src={line.imagePath}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-display text-base tracking-display text-ink">
              {line.name}
            </p>
            {line.variantLabel ? (
              <p className="text-sm text-ink-muted">{line.variantLabel}</p>
            ) : null}
            <p className="text-sm text-ink-muted">{formatCents(line.priceCents)}</p>
          </div>
          <p className="shrink-0 text-sm font-medium text-ink">
            {formatCents(lineTotal)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center border border-border">
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center text-ink hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
              aria-label={shopCopy.cartQtyDecrease}
              disabled={line.qty <= 1}
              onClick={() => setQty(line.variantId, line.qty - 1)}
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <input
              type="number"
              min={1}
              max={line.maxQty}
              value={line.qty}
              aria-label={shopCopy.quantity}
              onChange={(e) => onQtyInput(e.target.value)}
              className="h-11 w-12 border-x border-border bg-surface text-center text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center text-ink hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
              aria-label={shopCopy.cartQtyIncrease}
              disabled={line.qty >= line.maxQty}
              onClick={() => setQty(line.variantId, line.qty + 1)}
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>

          <button
            type="button"
            onClick={onRemove}
            className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Trash2 className="size-4" aria-hidden />
            {shopCopy.cartRemove}
          </button>
        </div>
      </div>
    </li>
  );
}

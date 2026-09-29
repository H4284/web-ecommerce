"use client";

import Image from "next/image";
import { shopCopy } from "@/content/shop";
import { formatCents } from "@/lib/shop/money";
import {
  deliveryFeeCents,
  type DeliveryMethod,
} from "@/lib/shop/settings-schema";
import { FreeDeliveryProgress } from "@/components/shop/free-delivery-progress";
import { useCartValidate } from "@/components/shop/use-cart-validate";
import { useCartStore } from "@/stores/cart";

type CheckoutSummaryProps = {
  deliveryMethodId: string;
  deliveryMethods: DeliveryMethod[];
  freeOverCents: number | null;
};

export function CheckoutSummary({
  deliveryMethodId,
  deliveryMethods,
  freeOverCents,
}: CheckoutSummaryProps) {
  const lines = useCartStore((s) => s.lines);
  const discountCode = useCartStore((s) => s.discountCode);
  const setDiscountCode = useCartStore((s) => s.setDiscountCode);
  const { result } = useCartValidate({ enabled: lines.length > 0 });

  const subtotal = result?.subtotalCents ?? 0;
  const discountAmount = result?.discount.amountCents ?? 0;
  const discountFree = result?.discount.freeDelivery ?? false;
  const method =
    deliveryMethods.find((m) => m.id === deliveryMethodId && m.active) ??
    deliveryMethods.find((m) => m.active) ??
    null;

  const netSubtotal = Math.max(0, subtotal - discountAmount);
  const fee =
    !method || discountFree
      ? 0
      : deliveryFeeCents(netSubtotal, method);
  const total = netSubtotal + fee;
  const threshold = method?.freeOverCents ?? freeOverCents;

  return (
    <aside className="flex h-fit flex-col gap-4 border border-border bg-surface-2 p-5 lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
      <h2 className="font-display text-xl tracking-display text-ink">
        {shopCopy.checkoutSummary}
      </h2>

      <ul className="flex flex-col gap-3">
        {lines.map((line) => (
          <li key={line.variantId} className="flex gap-3">
            <div className="relative size-14 shrink-0 overflow-hidden bg-surface">
              {line.imagePath ? (
                <Image
                  src={line.imagePath}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate text-ink">{line.name}</p>
              {line.variantLabel ? (
                <p className="text-ink-muted">{line.variantLabel}</p>
              ) : null}
              <p className="text-ink-muted">
                {line.qty} × {formatCents(line.priceCents)}
              </p>
            </div>
            <p className="shrink-0 text-sm font-medium text-ink">
              {formatCents(line.priceCents * line.qty)}
            </p>
          </li>
        ))}
      </ul>

      <FreeDeliveryProgress
        lines={lines}
        freeOverCents={threshold}
        discountFreeDelivery={discountFree}
      />

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-ink-muted">{shopCopy.checkoutDiscountCode}</span>
        <input
          defaultValue={discountCode ?? ""}
          onBlur={(e) => {
            const next = e.target.value.trim();
            setDiscountCode(next ? next.toUpperCase() : null);
          }}
          className="min-h-11 border border-border bg-surface px-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </label>
      {result?.discount.message ? (
        <p className="text-sm text-ink-muted" role="status">
          {result.discount.message}
        </p>
      ) : null}

      <dl className="flex flex-col gap-1.5 text-sm text-ink">
        <div className="flex justify-between gap-4">
          <dt>{shopCopy.cartSubtotal}</dt>
          <dd>{formatCents(subtotal)}</dd>
        </div>
        {discountAmount > 0 ? (
          <div className="flex justify-between gap-4 text-ink-muted">
            <dt>{shopCopy.cartDiscount}</dt>
            <dd>−{formatCents(discountAmount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt>{shopCopy.checkoutDeliveryLine}</dt>
          <dd>{fee === 0 ? shopCopy.checkoutFree : formatCents(fee)}</dd>
        </div>
        <div className="mt-1 flex justify-between gap-4 border-t border-border pt-2 text-base font-medium">
          <dt>{shopCopy.checkoutTotal}</dt>
          <dd>{formatCents(total)}</dd>
        </div>
      </dl>
    </aside>
  );
}

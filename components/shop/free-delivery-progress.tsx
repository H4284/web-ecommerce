"use client";

import { shopCopy } from "@/content/shop";
import { formatCents } from "@/lib/shop/money";
import {
  freeDeliveryRemainingCents,
  subtotalCents,
  type CartLine,
} from "@/stores/cart";

type FreeDeliveryProgressProps = {
  lines: CartLine[];
  freeOverCents: number | null;
  /** When a free_delivery discount is active, show the success state. */
  discountFreeDelivery?: boolean;
};

export function FreeDeliveryProgress({
  lines,
  freeOverCents,
  discountFreeDelivery = false,
}: FreeDeliveryProgressProps) {
  if (freeOverCents == null && !discountFreeDelivery) return null;

  const subtotal = subtotalCents(lines);
  const remaining =
    freeOverCents == null
      ? 0
      : freeDeliveryRemainingCents(subtotal, freeOverCents);
  const reached = discountFreeDelivery || remaining === 0;
  const ratio =
    freeOverCents != null && freeOverCents > 0
      ? Math.min(1, subtotal / freeOverCents)
      : reached
        ? 1
        : 0;

  const message = reached
    ? shopCopy.cartFreeDeliveryReached
    : shopCopy.cartFreeDeliveryAdd.replace("{amount}", formatCents(remaining));

  return (
    <div className="flex flex-col gap-2" role="status">
      <p className="text-sm text-ink">{message}</p>
      <div
        className="h-1.5 w-full overflow-hidden bg-surface-2"
        aria-hidden
      >
        <div
          className="h-full bg-accent transition-[width] duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}

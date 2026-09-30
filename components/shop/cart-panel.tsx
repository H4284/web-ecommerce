"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { shopCopy } from "@/content/shop";
import { formatCents } from "@/lib/shop/money";
import { CartLineRow } from "@/components/shop/cart-line-row";
import { FreeDeliveryProgress } from "@/components/shop/free-delivery-progress";
import { useCartValidate } from "@/components/shop/use-cart-validate";
import {
  itemCount,
  subtotalCents,
  useCartStore,
} from "@/stores/cart";

type CartPanelProps = {
  /** Run live validate (drawer open or cart page). */
  validate: boolean;
  freeOverCents: number | null;
  /** Wider layout on the full cart page. */
  wide?: boolean;
  onContinue?: () => void;
};

export function CartPanel({
  validate,
  freeOverCents,
  wide = false,
  onContinue,
}: CartPanelProps) {
  const searchParams = useSearchParams();
  const lines = useCartStore((s) => s.lines);
  const discountCode = useCartStore((s) => s.discountCode);
  const setDiscountCode = useCartStore((s) => s.setDiscountCode);
  const [draftCode, setDraftCode] = useState(discountCode ?? "");

  const { result, validating } = useCartValidate({ enabled: validate });

  const count = itemCount(lines);
  const localSubtotal = subtotalCents(lines);
  const subtotal = result?.subtotalCents ?? localSubtotal;
  const discountAmount = result?.discount.amountCents ?? 0;
  const discountMessage = result?.discount.message ?? null;
  const discountFree = result?.discount.freeDelivery ?? false;
  const emptyFromCheckout = searchParams.get("empty") === "1";

  function applyDiscount(e: FormEvent) {
    e.preventDefault();
    const next = draftCode.trim();
    setDiscountCode(next.length > 0 ? next.toUpperCase() : null);
  }

  if (count === 0) {
    return (
      <div className={wide ? "mx-auto max-w-2xl px-4 py-16 text-center" : "px-4 py-10 text-center"}>
        <p className="font-display text-2xl tracking-display text-ink">
          {shopCopy.cartTitle}
        </p>
        <p className="mt-3 text-ink-muted">
          {emptyFromCheckout ? shopCopy.checkoutEmptyRedirect : shopCopy.cartEmpty}
        </p>
        <Link
          href="/"
          onClick={onContinue}
          className="mt-6 inline-flex min-h-11 items-center justify-center bg-ink px-5 text-sm font-medium text-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {shopCopy.cartContinue}
        </Link>
      </div>
    );
  }

  return (
    <div
      className={
        wide
          ? "mx-auto grid max-w-5xl gap-10 px-4 py-10 lg:grid-cols-[1fr_22rem]"
          : "flex h-full min-h-0 flex-col"
      }
    >
      <div className={wide ? "" : "min-h-0 flex-1 overflow-y-auto px-4"}>
        {!wide ? (
          <p className="sr-only" aria-live="polite">
            {validating ? "…" : ""}
          </p>
        ) : (
          <h1 className="mb-6 font-display text-3xl tracking-display text-ink md:text-4xl">
            {shopCopy.cartTitle}
          </h1>
        )}

        {result?.messages?.length ? (
          <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-ink-muted">
            {result.messages.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        ) : null}

        <ul className="divide-y-0">
          {lines.map((line) => (
            <CartLineRow key={line.variantId} line={line} />
          ))}
        </ul>
      </div>

      <aside
        className={
          wide
            ? "flex h-fit flex-col gap-4 border border-border bg-surface-2 p-5"
            : "mt-auto flex flex-col gap-3 border-t border-border bg-surface px-4 py-4"
        }
      >
        <FreeDeliveryProgress
          lines={lines}
          freeOverCents={freeOverCents}
          discountFreeDelivery={discountFree}
        />

        <form onSubmit={applyDiscount} className="flex gap-2">
          <label className="sr-only" htmlFor={wide ? "cart-discount-page" : "cart-discount-drawer"}>
            {shopCopy.cartDiscountPlaceholder}
          </label>
          <input
            id={wide ? "cart-discount-page" : "cart-discount-drawer"}
            value={draftCode}
            onChange={(e) => setDraftCode(e.target.value)}
            placeholder={shopCopy.cartDiscountPlaceholder}
            className="min-h-11 flex-1 border border-border bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            autoComplete="off"
          />
          <button
            type="submit"
            className="min-h-11 border border-border bg-surface px-3 text-sm text-ink hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {shopCopy.cartDiscountApply}
          </button>
        </form>
        {discountMessage ? (
          <p className="text-sm text-ink-muted" role="status">
            {discountMessage}
          </p>
        ) : null}

        <dl className="flex flex-col gap-1 text-sm text-ink">
          <div className="flex justify-between gap-4">
            <dt>{shopCopy.cartSubtotal}</dt>
            <dd className="font-medium">{formatCents(subtotal)}</dd>
          </div>
          {discountAmount > 0 ? (
            <div className="flex justify-between gap-4 text-ink-muted">
              <dt>{shopCopy.cartDiscount}</dt>
              <dd>−{formatCents(discountAmount)}</dd>
            </div>
          ) : null}
        </dl>

        <p className="text-sm text-ink-muted">{shopCopy.cartDeliveryAtCheckout}</p>

        <Link
          href="/checkout"
          onClick={onContinue}
          className="inline-flex min-h-11 items-center justify-center bg-ink px-5 text-center text-sm font-medium text-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {shopCopy.cartCheckout}
        </Link>
        <Link
          href="/"
          onClick={onContinue}
          className="inline-flex min-h-11 items-center justify-center text-sm text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {shopCopy.cartContinue}
        </Link>
      </aside>
    </div>
  );
}

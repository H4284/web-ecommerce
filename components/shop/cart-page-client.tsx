import { Suspense } from "react";
import { CartPanel } from "@/components/shop/cart-panel";
import { useCartUi } from "@/components/shop/cart-ui";
import { shopCopy } from "@/content/shop";

function CartPageInner() {
  const { freeOverCents } = useCartUi();
  return <CartPanel validate freeOverCents={freeOverCents} wide />;
}

export function CartPageClient() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-16 text-center text-ink-muted">
          <h1 className="font-display text-3xl tracking-display text-ink md:text-4xl">
            {shopCopy.cartTitle}
          </h1>
          <p className="mt-4">{shopCopy.cartTitle}…</p>
        </div>
      }
    >
      <CartPageInner />
    </Suspense>
  );
}

"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { shopCopy } from "@/content/shop";
import type { DeliveryMethod, PaymentMethod } from "@/lib/shop/settings-schema";
import { itemCount, useCartStore } from "@/stores/cart";

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

type CheckoutPageClientProps = {
  deliveryMethods: DeliveryMethod[];
  paymentMethods: PaymentMethod[];
  freeOverCents: number | null;
};

export function CheckoutPageClient({
  deliveryMethods,
  paymentMethods,
  freeOverCents,
}: CheckoutPageClientProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const lines = useCartStore((s) => s.lines);
  const count = itemCount(lines);
  const empty = hydrated && count === 0;
  const ready = hydrated && count > 0;

  useEffect(() => {
    if (empty) router.replace("/cart?empty=1");
  }, [empty, router]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-ink-muted">
        <h1 className="font-display text-3xl tracking-display text-ink md:text-4xl">
          {shopCopy.checkoutTitle}
        </h1>
        <p className="mt-4">{shopCopy.checkoutTitle}…</p>
      </div>
    );
  }

  return (
    <CheckoutForm
      deliveryMethods={deliveryMethods}
      paymentMethods={paymentMethods}
      freeOverCents={freeOverCents}
    />
  );
}

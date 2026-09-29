"use client";

import { CartPanel } from "@/components/shop/cart-panel";
import { useCartUi } from "@/components/shop/cart-ui";

export function CartPageClient() {
  const { freeOverCents } = useCartUi();
  return <CartPanel validate freeOverCents={freeOverCents} wide />;
}

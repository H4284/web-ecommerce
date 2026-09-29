"use client";

import { useSyncExternalStore } from "react";
import { ShoppingBag } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { shopCopy } from "@/content/shop";
import { useCartUi } from "@/components/shop/cart-ui";
import { itemCount, useCartStore } from "@/stores/cart";
import { cn } from "cn";

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function CartButton() {
  const { openCart } = useCartUi();
  const lines = useCartStore((s) => s.lines);
  const hydrated = useHydrated();
  const reduceMotion = useReducedMotion();
  const count = hydrated ? itemCount(lines) : 0;

  const label =
    count > 0 ? `${shopCopy.cartOpen} (${count})` : shopCopy.cartOpen;

  return (
    <button
      type="button"
      onClick={openCart}
      className="relative inline-flex size-11 items-center justify-center text-ink transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label={label}
    >
      <ShoppingBag className="size-5" aria-hidden />
      <span
        key={count}
        className={cn(
          "absolute top-1.5 right-1.5 flex min-w-4 items-center justify-center rounded-sm bg-accent px-1 text-[0.65rem] leading-4 font-medium text-on-accent",
          hydrated &&
            count > 0 &&
            !reduceMotion &&
            "animate-[cart-count-pop_0.35s_var(--ease-out)]",
        )}
        aria-hidden
      >
        {count}
      </span>
    </button>
  );
}

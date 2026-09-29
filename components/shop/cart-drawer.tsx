"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CartPanel } from "@/components/shop/cart-panel";
import { useCartUi } from "@/components/shop/cart-ui";
import { shopCopy } from "@/content/shop";

export function CartDrawer() {
  const { open, setOpen, freeOverCents } = useCartUi();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        showCloseButton
        className="w-full gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle className="font-display text-xl tracking-display text-ink">
            {shopCopy.cartTitle}
          </SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col">
          <CartPanel
            validate={open}
            freeOverCents={freeOverCents}
            onContinue={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

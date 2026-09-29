"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type CartUiContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openCart: () => void;
  freeOverCents: number | null;
};

const CartUiContext = createContext<CartUiContextValue | null>(null);

export function CartUiProvider({
  children,
  freeOverCents,
}: {
  children: ReactNode;
  freeOverCents: number | null;
}) {
  const [open, setOpen] = useState(false);
  const openCart = useCallback(() => setOpen(true), []);

  const value = useMemo(
    () => ({ open, setOpen, openCart, freeOverCents }),
    [open, openCart, freeOverCents],
  );

  return (
    <CartUiContext.Provider value={value}>{children}</CartUiContext.Provider>
  );
}

export function useCartUi() {
  const ctx = useContext(CartUiContext);
  if (!ctx) {
    throw new Error("useCartUi must be used within CartUiProvider");
  }
  return ctx;
}

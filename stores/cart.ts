import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartLine = {
  variantId: string;
  productId: string;
  productSlug: string;
  sku: string;
  name: string;
  variantLabel: string;
  imagePath: string | null;
  priceCents: number;
  compareAtCents: number | null;
  qty: number;
  maxQty: number;
};

export type CartAddInput = Omit<CartLine, "qty"> & { qty?: number };

type CartState = {
  lines: CartLine[];
  discountCode: string | null;
  lastRemoved: CartLine | null;
  add: (input: CartAddInput) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  restore: () => void;
  clear: () => void;
  applyServerLines: (lines: CartLine[]) => void;
  setDiscountCode: (code: string | null) => void;
};

function assertInt(name: string, value: number) {
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer`);
  }
}

function clampQty(qty: number, maxQty: number): number {
  assertInt("qty", qty);
  assertInt("maxQty", maxQty);
  const max = Math.max(1, maxQty);
  return Math.min(max, Math.max(1, qty));
}

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key) {
      return map.get(key) ?? null;
    },
    key(index) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key) {
      map.delete(key);
    },
    setItem(key, value) {
      map.set(key, value);
    },
  };
}

const storage =
  typeof window !== "undefined"
    ? createJSONStorage(() => localStorage)
    : createJSONStorage(() => memoryStorage());

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      discountCode: null,
      lastRemoved: null,

      add(input) {
        assertInt("priceCents", input.priceCents);
        if (input.compareAtCents != null) assertInt("compareAtCents", input.compareAtCents);
        assertInt("maxQty", input.maxQty);
        const addQty = clampQty(input.qty ?? 1, input.maxQty);

        set((state) => {
          const existing = state.lines.find((l) => l.variantId === input.variantId);
          if (existing) {
            const qty = clampQty(existing.qty + addQty, input.maxQty);
            return {
              lines: state.lines.map((l) =>
                l.variantId === input.variantId
                  ? {
                      ...l,
                      ...input,
                      qty,
                      maxQty: input.maxQty,
                    }
                  : l,
              ),
            };
          }
          return {
            lines: [
              ...state.lines,
              {
                variantId: input.variantId,
                productId: input.productId,
                productSlug: input.productSlug,
                sku: input.sku,
                name: input.name,
                variantLabel: input.variantLabel,
                imagePath: input.imagePath,
                priceCents: input.priceCents,
                compareAtCents: input.compareAtCents,
                maxQty: input.maxQty,
                qty: addQty,
              },
            ],
          };
        });
      },

      setQty(variantId, qty) {
        assertInt("qty", qty);
        set((state) => {
          const line = state.lines.find((l) => l.variantId === variantId);
          if (!line) return state;
          return {
            lines: state.lines.map((l) =>
              l.variantId === variantId
                ? { ...l, qty: clampQty(qty, l.maxQty) }
                : l,
            ),
          };
        });
      },

      remove(variantId) {
        const line = get().lines.find((l) => l.variantId === variantId);
        if (!line) return;
        set((state) => ({
          lines: state.lines.filter((l) => l.variantId !== variantId),
          lastRemoved: { ...line },
        }));
      },

      restore() {
        const removed = get().lastRemoved;
        if (!removed) return;
        set((state) => {
          if (state.lines.some((l) => l.variantId === removed.variantId)) {
            return { lastRemoved: null };
          }
          return {
            lines: [...state.lines, removed],
            lastRemoved: null,
          };
        });
      },

      clear() {
        set({ lines: [], discountCode: null, lastRemoved: null });
      },

      applyServerLines(lines) {
        for (const line of lines) {
          assertInt("priceCents", line.priceCents);
          if (line.compareAtCents != null) assertInt("compareAtCents", line.compareAtCents);
          assertInt("qty", line.qty);
          assertInt("maxQty", line.maxQty);
        }
        set({
          lines: lines.map((line) => ({
            ...line,
            qty: clampQty(line.qty, line.maxQty),
          })),
        });
      },

      setDiscountCode(code) {
        set({ discountCode: code });
      },
    }),
    {
      name: "cart_v1",
      storage,
      partialize: (state) => ({
        lines: state.lines,
        discountCode: state.discountCode,
      }),
    },
  ),
);

/** Sum of line quantities. */
export function itemCount(lines: CartLine[]): number {
  let total = 0;
  for (const line of lines) {
    assertInt("qty", line.qty);
    total += line.qty;
  }
  return total;
}

/** Integer subtotal in cents. */
export function subtotalCents(lines: CartLine[]): number {
  let total = 0;
  for (const line of lines) {
    assertInt("priceCents", line.priceCents);
    assertInt("qty", line.qty);
    total += line.priceCents * line.qty;
  }
  return total;
}

/**
 * Cents still needed to reach free delivery.
 * Returns 0 when already free or when there is no threshold.
 */
export function freeDeliveryRemainingCents(
  subtotal: number,
  thresholdCents: number | null,
): number {
  assertInt("subtotal", subtotal);
  if (thresholdCents == null) return 0;
  assertInt("thresholdCents", thresholdCents);
  if (subtotal >= thresholdCents) return 0;
  return thresholdCents - subtotal;
}

/** Reset store state (tests). */
export function resetCartStore() {
  useCartStore.setState({
    lines: [],
    discountCode: null,
    lastRemoved: null,
  });
}

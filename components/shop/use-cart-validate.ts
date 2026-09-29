"use client";

import { useEffect, useRef, useState } from "react";
import {
  postCartValidate,
  type CartValidateResponse,
} from "@/lib/shop/cart-client";
import { useCartStore, type CartLine } from "@/stores/cart";

const DEBOUNCE_MS = 350;

type UseCartValidateOptions = {
  /** When true, validate immediately then on line/discount changes. */
  enabled: boolean;
};

type UseCartValidateResult = {
  result: CartValidateResponse | null;
  validating: boolean;
  error: string | null;
  refresh: () => void;
};

/** Debounced live cart check against `/api/cart/validate`. */
export function useCartValidate({
  enabled,
}: UseCartValidateOptions): UseCartValidateResult {
  const lines = useCartStore((s) => s.lines);
  const discountCode = useCartStore((s) => s.discountCode);
  const applyServerLines = useCartStore((s) => s.applyServerLines);

  const [result, setResult] = useState<CartValidateResponse | null>(null);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const requestId = useRef(0);

  const linesKey = lines
    .map((l: CartLine) => `${l.variantId}:${l.qty}`)
    .join("|");

  useEffect(() => {
    if (!enabled || lines.length === 0) return;

    const id = ++requestId.current;
    const timer = window.setTimeout(async () => {
      setValidating(true);
      setError(null);
      try {
        const data = await postCartValidate({
          lines: lines.map((l) => ({
            variantId: l.variantId,
            productId: l.productId,
            qty: l.qty,
          })),
          discountCode,
        });
        if (id !== requestId.current) return;
        applyServerLines(data.lines);
        setResult(data);
      } catch {
        if (id !== requestId.current) return;
        setError("validate");
      } finally {
        if (id === requestId.current) setValidating(false);
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
    // linesKey / discountCode / tick drive the request; applyServerLines is stable enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional debounce keys
  }, [enabled, linesKey, discountCode, tick]);

  const active = enabled && lines.length > 0;

  return {
    result: active ? result : null,
    validating: active ? validating : false,
    error: active ? error : null,
    refresh: () => setTick((n) => n + 1),
  };
}

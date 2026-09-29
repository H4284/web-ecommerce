"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import type { ThankYouOrder } from "@/lib/shop/order-queries";

type PurchaseTrackerProps = {
  order: ThankYouOrder;
};

/** Fires `purchase` once per order id (sessionStorage). */
export function PurchaseTracker({ order }: PurchaseTrackerProps) {
  useEffect(() => {
    track("purchase", {
      orderId: order.id,
      value: order.totalCents / 100,
      currency: "EUR",
      items: order.lines.map((line) => ({
        item_id: line.sku,
        item_name: line.name,
        quantity: line.qty,
        price: line.priceCents / 100,
      })),
    });
  }, [order]);

  return null;
}

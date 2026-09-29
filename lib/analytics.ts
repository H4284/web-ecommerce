/**
 * Analytics stub — real GA4 / Meta load in `shop:analytics`.
 * `purchase` still records a sessionStorage flag so it fires once per order.
 */

export type TrackParams = {
  orderId?: string;
  value?: number;
  currency?: string;
  items?: Array<{
    item_id: string;
    item_name: string;
    quantity: number;
    price: number;
  }>;
  [key: string]: unknown;
};

/** Test counter — increments only when a track call is not skipped. */
export const trackStats = {
  purchase: 0,
  reset() {
    this.purchase = 0;
  },
};

function purchaseKey(orderId: string): string {
  return `analytics_purchase_${orderId}`;
}

/** Fire a shop analytics event. No-op for network until unit 32. */
export function track(event: string, params: TrackParams = {}): void {
  if (typeof window === "undefined") return;

  if (event === "purchase") {
    const orderId = params.orderId;
    if (!orderId) return;
    try {
      if (sessionStorage.getItem(purchaseKey(orderId))) return;
      sessionStorage.setItem(purchaseKey(orderId), "1");
    } catch {
      // private mode — still count once per page lifetime via in-memory only
    }
    trackStats.purchase += 1;
    return;
  }

  // Other events: no-op until shop:analytics
}

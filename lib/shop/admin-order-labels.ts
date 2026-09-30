import { adminCopy } from "@/content/admin";
import type { OrderStatus } from "@/lib/shop/admin-order-schema";
import { PAYMENT_STATUSES } from "@/lib/shop/admin-order-schema";

export function orderStatusLabel(status: string): string {
  switch (status as OrderStatus) {
    case "pending":
      return adminCopy.orderStatusPending;
    case "confirmed":
      return adminCopy.orderStatusConfirmed;
    case "shipped":
      return adminCopy.orderStatusShipped;
    case "delivered":
      return adminCopy.orderStatusDelivered;
    case "cancelled":
      return adminCopy.orderStatusCancelled;
    default:
      return status;
  }
}

export function paymentStatusLabel(status: string): string {
  switch (status as (typeof PAYMENT_STATUSES)[number]) {
    case "cod_due":
      return adminCopy.orderPayCodDue;
    case "awaiting_payment":
      return adminCopy.orderPayAwaiting;
    case "paid":
      return adminCopy.orderPayPaid;
    case "failed":
      return adminCopy.orderPayFailed;
    case "refunded":
      return adminCopy.orderPayRefunded;
    default:
      return status;
  }
}

export function formatOrderDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("sq-XK", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

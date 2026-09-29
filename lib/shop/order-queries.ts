import "server-only";
import { db } from "@/lib/firebase/admin";

export type ThankYouOrderLine = {
  variantId: string;
  productId: string;
  sku: string;
  name: string;
  variantLabel: string;
  priceCents: number;
  qty: number;
};

export type ThankYouOrder = {
  id: string;
  number: string;
  status: string;
  paymentMethodId: string;
  paymentStatus: string;
  lines: ThankYouOrderLine[];
  subtotalCents: number;
  discountAmountCents: number;
  deliveryCents: number;
  totalCents: number;
  delivery: {
    recipient: string;
    address: string;
    city: string;
    postalCode?: string;
    phone: string;
    country: string;
  };
  customer: {
    email: string;
    name: string;
    phone?: string | null;
  };
};

/** Load an order for the thank-you page (server only). */
export async function getOrderForThankYou(
  orderId: string,
): Promise<ThankYouOrder | null> {
  const snap = await db.collection("orders").doc(orderId).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  return {
    id: snap.id,
    number: String(data.number),
    status: String(data.status),
    paymentMethodId: String(data.paymentMethodId),
    paymentStatus: String(data.paymentStatus),
    lines: (data.lines as ThankYouOrderLine[]) ?? [],
    subtotalCents: Number(data.subtotalCents),
    discountAmountCents: Number(data.discount?.amountCents ?? 0),
    deliveryCents: Number(data.deliveryCents),
    totalCents: Number(data.totalCents),
    delivery: data.delivery as ThankYouOrder["delivery"],
    customer: data.customer as ThankYouOrder["customer"],
  };
}

import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const discount = data.discount as { amountCents?: number } | null;
  const linesRaw = (data.lines as Array<Record<string, unknown>>) ?? [];

  return {
    id: data.id,
    number: String(data.number),
    status: String(data.status),
    paymentMethodId: String(data.payment_method_id),
    paymentStatus: String(data.payment_status),
    lines: linesRaw.map((l) => ({
      variantId: String(l.variantId),
      productId: String(l.productId),
      sku: String(l.sku),
      name: String(l.name),
      variantLabel: String(l.variantLabel),
      priceCents: Number(l.priceCents),
      qty: Number(l.qty),
    })),
    subtotalCents: Number(data.subtotal_cents),
    discountAmountCents: Number(discount?.amountCents ?? 0),
    deliveryCents: Number(data.delivery_cents),
    totalCents: Number(data.total_cents),
    delivery: data.delivery as ThankYouOrder["delivery"],
    customer: data.customer as ThankYouOrder["customer"],
  };
}

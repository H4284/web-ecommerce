import { z } from "zod";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "cod_due",
  "awaiting_payment",
  "paid",
  "failed",
  "refunded",
] as const;

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(ORDER_STATUSES),
  note: z.string().max(500).optional().default(""),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const markOrderPaidSchema = z.object({
  orderId: z.string().min(1),
  note: z.string().max(500).optional().default(""),
});

export const updateOrderNoteSchema = z.object({
  orderId: z.string().min(1),
  internalNote: z.string().max(2000),
});

export const listOrdersFilterSchema = z.object({
  status: z.enum(ORDER_STATUSES).or(z.literal("all")).default("all"),
  paymentStatus: z.enum(PAYMENT_STATUSES).or(z.literal("all")).default("all"),
  q: z.string().max(80).optional().default(""),
  from: z.string().optional().default(""),
  to: z.string().optional().default(""),
});

export type ListOrdersFilter = z.infer<typeof listOrdersFilterSchema>;

export type AdminOrderLine = {
  variantId: string;
  productId: string;
  sku: string;
  name: string;
  variantLabel: string;
  priceCents: number;
  qty: number;
};

export type AdminOrderTimelineEntry = {
  status: string;
  at: string;
  by: string;
  note: string;
};

export type AdminOrderAddress = {
  recipient: string;
  address: string;
  city: string;
  postalCode?: string;
  phone: string;
  country: string;
};

export type AdminOrder = {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  paymentMethodId: string;
  stockTaken: boolean;
  customer: {
    email: string;
    name: string;
    phone?: string | null;
    uid?: string | null;
  };
  delivery: AdminOrderAddress;
  billing?: AdminOrderAddress | null;
  billingSameAsDelivery?: boolean;
  lines: AdminOrderLine[];
  subtotalCents: number;
  discountAmountCents: number;
  deliveryCents: number;
  totalCents: number;
  deliveryMethodId: string;
  createdAt: string;
  timeline: AdminOrderTimelineEntry[];
  internalNote: string;
  bankTransactionId?: string | null;
  bankLast4?: string | null;
};

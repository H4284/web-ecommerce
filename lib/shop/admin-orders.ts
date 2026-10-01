import "server-only";
import { updateTag } from "next/cache";
import { adminAction } from "@/lib/shop/admin";
import { requireAdmin, type ShopUser } from "@/lib/shop/auth";
import {
  listOrdersFilterSchema,
  markOrderPaidSchema,
  updateOrderNoteSchema,
  updateOrderStatusSchema,
  type AdminOrder,
  type AdminOrderLine,
  type AdminOrderTimelineEntry,
  type ListOrdersFilter,
  type UpdateOrderStatusInput,
} from "@/lib/shop/admin-order-schema";
import { sendOrderStatusEmail } from "@/lib/shop/email";
import { createPgClient } from "@/lib/supabase/pg";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type { AdminOrder, AdminOrderLine, OrderStatus } from "@/lib/shop/admin-order-schema";

function mapOrder(row: Record<string, unknown>): AdminOrder {
  const discount = row.discount as { amountCents?: number } | null;
  return {
    id: String(row.id),
    number: String(row.number ?? ""),
    status: String(row.status ?? ""),
    paymentStatus: String(row.payment_status ?? ""),
    paymentMethodId: String(row.payment_method_id ?? ""),
    stockTaken: Boolean(row.stock_taken),
    customer: row.customer as AdminOrder["customer"],
    delivery: row.delivery as AdminOrder["delivery"],
    billing: (row.billing as AdminOrder["delivery"]) ?? null,
    billingSameAsDelivery: Boolean(row.billing_same_as_delivery ?? true),
    lines: (row.lines as AdminOrderLine[]) ?? [],
    subtotalCents: Number(row.subtotal_cents ?? 0),
    discountAmountCents: Number(discount?.amountCents ?? 0),
    deliveryCents: Number(row.delivery_cents ?? 0),
    totalCents: Number(row.total_cents ?? 0),
    deliveryMethodId: String(row.delivery_method_id ?? ""),
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date(row.created_at as string).toISOString(),
    timeline: (row.timeline as AdminOrderTimelineEntry[]) ?? [],
    internalNote: String(row.internal_note ?? row.notes ?? ""),
    bankTransactionId: (row.bank_transaction_id as string | null) ?? null,
    bankLast4: (row.bank_last4 as string | null) ?? null,
  };
}

export async function listAdminOrders(
  rawFilter: Partial<ListOrdersFilter> = {},
): Promise<AdminOrder[]> {
  await requireAdmin();
  const filter = listOrdersFilterSchema.parse(rawFilter);
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  const q = filter.q.trim().toLowerCase();
  const fromMs = filter.from ? Date.parse(filter.from) : NaN;
  const toMs = filter.to ? Date.parse(filter.to) : NaN;

  const items: AdminOrder[] = [];
  for (const row of data ?? []) {
    const order = mapOrder(row as Record<string, unknown>);
    if (filter.status !== "all" && order.status !== filter.status) continue;
    if (filter.paymentStatus !== "all" && order.paymentStatus !== filter.paymentStatus) {
      continue;
    }
    const createdMs = Date.parse(order.createdAt);
    if (Number.isFinite(fromMs) && createdMs < fromMs) continue;
    if (Number.isFinite(toMs) && createdMs > toMs + 86_400_000 - 1) continue;
    if (q) {
      const hay = [
        order.number,
        order.customer.email,
        order.customer.phone ?? "",
        order.customer.name,
        order.delivery.phone,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) continue;
    }
    items.push(order);
  }
  return items;
}

export async function getAdminOrder(id: string): Promise<AdminOrder | null> {
  await requireAdmin();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapOrder(data as Record<string, unknown>);
}

export async function updateAdminOrderStatus(input: unknown) {
  return adminAction({
    schema: updateOrderStatusSchema,
    action: "order.status",
    target: (d) => `orders/${d.orderId}`,
    input,
    fn: async (data, user) => {
      await applyStatusChange(data, user);
      return { id: data.orderId, status: data.status };
    },
  });
}

export async function markAdminOrderPaid(input: unknown) {
  return adminAction({
    schema: markOrderPaidSchema,
    action: "order.markPaid",
    target: (d) => `orders/${d.orderId}`,
    input,
    fn: async (data, user) => {
      const admin = getSupabaseAdmin();
      const { data: order, error } = await admin
        .from("orders")
        .select("*")
        .eq("id", data.orderId)
        .maybeSingle();
      if (error) throw error;
      if (!order) throw new Error("Order not found");
      if (order.payment_method_id !== "transfer") {
        throw new Error("Only transfer orders can be marked paid here");
      }
      const at = new Date().toISOString();
      const timeline = [
        ...((order.timeline as AdminOrderTimelineEntry[]) ?? []),
        {
          status: String(order.status),
          at,
          by: user.email ?? user.uid,
          note: data.note || "Marked paid",
        },
      ];
      const { error: upErr } = await admin
        .from("orders")
        .update({
          payment_status: "paid",
          timeline,
          updated_at: at,
        })
        .eq("id", data.orderId);
      if (upErr) throw upErr;
      return { id: data.orderId };
    },
  });
}

export async function updateAdminOrderNote(input: unknown) {
  return adminAction({
    schema: updateOrderNoteSchema,
    action: "order.note",
    target: (d) => `orders/${d.orderId}`,
    input,
    fn: async (data) => {
      const admin = getSupabaseAdmin();
      const { error } = await admin
        .from("orders")
        .update({
          internal_note: data.internalNote,
          notes: data.internalNote,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.orderId);
      if (error) throw error;
      return { id: data.orderId };
    },
  });
}

/** UTF-8 CSV with BOM for Excel (ë / ç). */
export async function exportAdminOrdersCsv(
  filter: Partial<ListOrdersFilter> = {},
): Promise<string> {
  const orders = await listAdminOrders(filter);
  const header = [
    "number",
    "createdAt",
    "customer",
    "email",
    "phone",
    "totalCents",
    "status",
    "paymentStatus",
    "paymentMethodId",
    "city",
  ];
  const rows = orders.map((o) =>
    [
      o.number,
      o.createdAt,
      o.customer.name,
      o.customer.email,
      o.customer.phone ?? o.delivery.phone,
      String(o.totalCents),
      o.status,
      o.paymentStatus,
      o.paymentMethodId,
      o.delivery.city,
    ]
      .map(csvEscape)
      .join(","),
  );
  return `\uFEFF${header.join(",")}\n${rows.join("\n")}\n`;
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function applyStatusChange(
  data: UpdateOrderStatusInput,
  user: ShopUser,
): Promise<void> {
  const at = new Date().toISOString();
  const by = user.email ?? user.uid;
  const note = data.note ?? "";

  let changed = false;
  if (data.status === "cancelled") {
    changed = await cancelOrderOnce(data.orderId, at, by, note);
  } else {
    changed = await updateStatusOnce(data.orderId, data.status, at, by, note);
  }

  if (changed) {
    await sendOrderStatusEmail(data.orderId, note || undefined);
    updateTag("catalog");
  }
}

async function updateStatusOnce(
  orderId: string,
  status: string,
  at: string,
  by: string,
  note: string,
): Promise<boolean> {
  const client = createPgClient();
  await client.connect();
  try {
    await client.query("begin");
    const res = await client.query(
      `select * from orders where id = $1 for update`,
      [orderId],
    );
    if (!res.rowCount) throw new Error("Order not found");
    const order = res.rows[0] as Record<string, unknown>;
    if (order.status === "cancelled") throw new Error("Order is cancelled");
    if (order.status === status) {
      await client.query("rollback");
      return false;
    }
    const timeline = [
      ...((order.timeline as AdminOrderTimelineEntry[]) ?? []),
      { status, at, by, note },
    ];
    await client.query(
      `update orders set status = $1, timeline = $2::jsonb, updated_at = $3 where id = $4`,
      [status, JSON.stringify(timeline), at, orderId],
    );
    await client.query("commit");
    return true;
  } catch (err) {
    try {
      await client.query("rollback");
    } catch {
      // ignore
    }
    throw err;
  } finally {
    await client.end();
  }
}

/** Cancel once: restore stock only when stock_taken is true. */
async function cancelOrderOnce(
  orderId: string,
  at: string,
  by: string,
  note: string,
): Promise<boolean> {
  const client = createPgClient();
  await client.connect();
  try {
    await client.query("begin");
    const res = await client.query(
      `select * from orders where id = $1 for update`,
      [orderId],
    );
    if (!res.rowCount) throw new Error("Order not found");
    const order = res.rows[0] as Record<string, unknown>;
    if (order.status === "cancelled") {
      await client.query("rollback");
      return false;
    }

    const lines = (order.lines as AdminOrderLine[]) ?? [];
    if (order.stock_taken === true) {
      const productDeltas = new Map<string, number>();
      for (const line of lines) {
        await client.query(
          `update variants set stock = stock + $1, updated_at = $2
           where product_id = $3 and id = $4`,
          [line.qty, at, line.productId, line.variantId],
        );
        productDeltas.set(
          line.productId,
          (productDeltas.get(line.productId) ?? 0) + line.qty,
        );
      }
      for (const [productId, delta] of productDeltas) {
        await client.query(
          `update products set total_stock = total_stock + $1, updated_at = $2 where id = $3`,
          [delta, at, productId],
        );
      }
    }

    const timeline = [
      ...((order.timeline as AdminOrderTimelineEntry[]) ?? []),
      { status: "cancelled", at, by, note },
    ];
    await client.query(
      `update orders
       set status = 'cancelled', stock_taken = false, timeline = $1::jsonb, updated_at = $2
       where id = $3`,
      [JSON.stringify(timeline), at, orderId],
    );
    await client.query("commit");
    return true;
  } catch (err) {
    try {
      await client.query("rollback");
    } catch {
      // ignore
    }
    throw err;
  } finally {
    await client.end();
  }
}

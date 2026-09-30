import "server-only";
import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { updateTag } from "next/cache";
import { db } from "@/lib/firebase/admin";
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
  type OrderStatus,
  type UpdateOrderStatusInput,
} from "@/lib/shop/admin-order-schema";
import { sendOrderStatusEmail } from "@/lib/shop/email";

export type { AdminOrder, AdminOrderLine, OrderStatus };

function mapOrder(id: string, data: FirebaseFirestore.DocumentData): AdminOrder {
  return {
    id,
    number: String(data.number ?? ""),
    status: String(data.status ?? ""),
    paymentStatus: String(data.paymentStatus ?? ""),
    paymentMethodId: String(data.paymentMethodId ?? ""),
    stockTaken: Boolean(data.stockTaken),
    customer: data.customer as AdminOrder["customer"],
    delivery: data.delivery as AdminOrder["delivery"],
    billing: (data.billing as AdminOrder["delivery"]) ?? null,
    billingSameAsDelivery: Boolean(data.billingSameAsDelivery ?? true),
    lines: (data.lines as AdminOrderLine[]) ?? [],
    subtotalCents: Number(data.subtotalCents ?? 0),
    discountAmountCents: Number(data.discount?.amountCents ?? 0),
    deliveryCents: Number(data.deliveryCents ?? 0),
    totalCents: Number(data.totalCents ?? 0),
    deliveryMethodId: String(data.deliveryMethodId ?? ""),
    createdAt: String(data.createdAt ?? ""),
    timeline: (data.timeline as AdminOrderTimelineEntry[]) ?? [],
    internalNote: String(data.internalNote ?? ""),
    bankTransactionId: (data.bankTransactionId as string | null) ?? null,
    bankLast4: (data.bankLast4 as string | null) ?? null,
  };
}

export async function listAdminOrders(
  rawFilter: Partial<ListOrdersFilter> = {},
): Promise<AdminOrder[]> {
  await requireAdmin();
  const filter = listOrdersFilterSchema.parse(rawFilter);
  const snap = await db.collection("orders").orderBy("createdAt", "desc").limit(200).get();

  const q = filter.q.trim().toLowerCase();
  const fromMs = filter.from ? Date.parse(filter.from) : NaN;
  const toMs = filter.to ? Date.parse(filter.to) : NaN;

  const items: AdminOrder[] = [];
  for (const doc of snap.docs) {
    const order = mapOrder(doc.id, doc.data());
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
  const snap = await db.collection("orders").doc(id).get();
  if (!snap.exists) return null;
  return mapOrder(snap.id, snap.data()!);
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
      const ref = db.collection("orders").doc(data.orderId);
      const snap = await ref.get();
      if (!snap.exists) throw new Error("Order not found");
      const order = snap.data()!;
      if (order.paymentMethodId !== "transfer") {
        throw new Error("Only transfer orders can be marked paid here");
      }
      const at = new Date().toISOString();
      const entry = {
        status: String(order.status),
        at,
        by: user.email ?? user.uid,
        note: data.note || "Marked paid",
      };
      await ref.update({
        paymentStatus: "paid",
        timeline: FieldValue.arrayUnion(entry),
      });
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
      await db.collection("orders").doc(data.orderId).set(
        { internalNote: data.internalNote },
        { merge: true },
      );
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
  const ref = db.collection("orders").doc(data.orderId);
  const at = new Date().toISOString();
  const by = user.email ?? user.uid;
  const note = data.note ?? "";

  let changed = false;
  if (data.status === "cancelled") {
    changed = await cancelOrderOnce(ref, at, by, note);
  } else {
    changed = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("Order not found");
      const order = snap.data()!;
      if (order.status === "cancelled") {
        throw new Error("Order is cancelled");
      }
      if (order.status === data.status) return false;
      tx.update(ref, {
        status: data.status,
        timeline: FieldValue.arrayUnion({
          status: data.status,
          at,
          by,
          note,
        }),
      });
      return true;
    });
  }

  if (changed) {
    await sendOrderStatusEmail(data.orderId, note || undefined);
    updateTag("catalog");
  }
}

/** Cancel once: restore stock only when stockTaken is true. Returns false if already cancelled. */
async function cancelOrderOnce(
  ref: DocumentReference,
  at: string,
  by: string,
  note: string,
): Promise<boolean> {
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Order not found");
    const order = snap.data()!;

    if (order.status === "cancelled") {
      return false;
    }

    const lines = (order.lines as AdminOrderLine[]) ?? [];
    type VariantRead = {
      ref: DocumentReference;
      stock: number;
      qty: number;
      productId: string;
    };
    const variantReads: VariantRead[] = [];
    const productIds = new Set<string>();

    if (order.stockTaken === true) {
      for (const line of lines) {
        const vref = db
          .collection("products")
          .doc(line.productId)
          .collection("variants")
          .doc(line.variantId);
        const vsnap = await tx.get(vref);
        if (!vsnap.exists) continue;
        variantReads.push({
          ref: vref,
          stock: Number(vsnap.data()?.stock ?? 0),
          qty: line.qty,
          productId: line.productId,
        });
        productIds.add(line.productId);
      }
    }

    const productReads: Array<{
      ref: DocumentReference;
      totalStock: number;
      delta: number;
    }> = [];
    const deltas = new Map<string, number>();
    for (const row of variantReads) {
      deltas.set(row.productId, (deltas.get(row.productId) ?? 0) + row.qty);
    }
    for (const productId of productIds) {
      const pref = db.collection("products").doc(productId);
      const psnap = await tx.get(pref);
      if (!psnap.exists) continue;
      productReads.push({
        ref: pref,
        totalStock: Number(psnap.data()?.totalStock ?? 0),
        delta: deltas.get(productId) ?? 0,
      });
    }

    for (const row of variantReads) {
      tx.update(row.ref, { stock: row.stock + row.qty });
    }
    for (const row of productReads) {
      tx.update(row.ref, {
        totalStock: row.totalStock + row.delta,
        updatedAt: at,
      });
    }

    tx.update(ref, {
      status: "cancelled",
      stockTaken: false,
      timeline: FieldValue.arrayUnion({
        status: "cancelled",
        at,
        by,
        note,
      }),
    });
    return true;
  });
}

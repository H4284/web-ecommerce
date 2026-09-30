import "server-only";
import { AggregateField } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/shop/auth";

export const LOW_STOCK_THRESHOLD = 5;

const NON_CANCELLED = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
] as const;

export type DashboardPeriodStats = {
  orders: number;
  revenueCents: number;
  averageCents: number;
};

export type DashboardOrderRow = {
  id: string;
  number: string;
  createdAt: string;
  customerName: string;
  totalCents: number;
  status: string;
};

export type DashboardLowStockRow = {
  id: string;
  name: string;
  slug: string;
  totalStock: number;
};

export type AdminDashboard = {
  email: string | null;
  uid: string;
  today: DashboardPeriodStats;
  days7: DashboardPeriodStats;
  days30: DashboardPeriodStats;
  latestOrders: DashboardOrderRow[];
  lowStock: DashboardLowStockRow[];
};

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function emptyStats(): DashboardPeriodStats {
  return { orders: 0, revenueCents: 0, averageCents: 0 };
}

async function periodStats(
  fromIso: string,
  nowIso: string,
): Promise<DashboardPeriodStats> {
  // status in + createdAt range — composite index in firestore.indexes.json
  const snap = await db
    .collection("orders")
    .where("status", "in", [...NON_CANCELLED])
    .where("createdAt", ">=", fromIso)
    .where("createdAt", "<=", nowIso)
    .aggregate({
      orders: AggregateField.count(),
      revenueCents: AggregateField.sum("totalCents"),
    })
    .get();

  const data = snap.data();
  const orders = Number(data.orders ?? 0);
  const revenueCents = Math.round(Number(data.revenueCents ?? 0));
  return {
    orders,
    revenueCents,
    averageCents: orders > 0 ? Math.round(revenueCents / orders) : 0,
  };
}

async function latestOrders(limit = 10): Promise<DashboardOrderRow[]> {
  const snap = await db
    .collection("orders")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    const customer = (d.customer ?? {}) as { name?: string };
    return {
      id: doc.id,
      number: String(d.number ?? ""),
      createdAt: String(d.createdAt ?? ""),
      customerName: String(customer.name ?? ""),
      totalCents: Number(d.totalCents ?? 0),
      status: String(d.status ?? ""),
    };
  });
}

async function lowStockProducts(
  threshold = LOW_STOCK_THRESHOLD,
): Promise<DashboardLowStockRow[]> {
  const snap = await db
    .collection("products")
    .where("totalStock", "<=", threshold)
    .orderBy("totalStock", "asc")
    .limit(20)
    .get();

  const rows: DashboardLowStockRow[] = [];
  for (const doc of snap.docs) {
    const d = doc.data();
    if (d.status === "archived") continue;
    rows.push({
      id: doc.id,
      name: String(d.name ?? ""),
      slug: String(d.slug ?? ""),
      totalStock: Number(d.totalStock ?? 0),
    });
  }
  return rows;
}

/** Admin home: period cards, latest orders, low stock. */
export async function getAdminDashboard(
  now: Date = new Date(),
): Promise<AdminDashboard> {
  const user = await requireAdmin();
  const nowIso = now.toISOString();
  const todayStart = startOfUtcDay(now).toISOString();
  const days7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const days30 = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [today, week, month, latest, low] = await Promise.all([
    periodStats(todayStart, nowIso).catch(() => emptyStats()),
    periodStats(days7, nowIso).catch(() => emptyStats()),
    periodStats(days30, nowIso).catch(() => emptyStats()),
    latestOrders(10).catch(() => [] as DashboardOrderRow[]),
    lowStockProducts().catch(() => [] as DashboardLowStockRow[]),
  ]);

  return {
    email: user.email,
    uid: user.uid,
    today,
    days7: week,
    days30: month,
    latestOrders: latest,
    lowStock: low,
  };
}

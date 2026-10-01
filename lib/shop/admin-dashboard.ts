import "server-only";
import { requireAdmin } from "@/lib/shop/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("orders")
    .select("total_cents, status, created_at")
    .in("status", [...NON_CANCELLED])
    .gte("created_at", fromIso)
    .lte("created_at", nowIso);
  if (error) throw error;

  const orders = data?.length ?? 0;
  const revenueCents = (data ?? []).reduce(
    (sum, row) => sum + Number(row.total_cents ?? 0),
    0,
  );
  return {
    orders,
    revenueCents,
    averageCents: orders > 0 ? Math.round(revenueCents / orders) : 0,
  };
}

async function latestOrders(limit = 10): Promise<DashboardOrderRow[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("orders")
    .select("id, number, created_at, customer, total_cents, status")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((row) => {
    const customer = (row.customer ?? {}) as { name?: string };
    return {
      id: String(row.id),
      number: String(row.number ?? ""),
      createdAt:
        typeof row.created_at === "string"
          ? row.created_at
          : new Date(row.created_at as string).toISOString(),
      customerName: String(customer.name ?? ""),
      totalCents: Number(row.total_cents ?? 0),
      status: String(row.status ?? ""),
    };
  });
}

async function lowStockProducts(
  threshold = LOW_STOCK_THRESHOLD,
): Promise<DashboardLowStockRow[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("products")
    .select("id, name, slug, total_stock, status")
    .lte("total_stock", threshold)
    .neq("status", "archived")
    .order("total_stock", { ascending: true })
    .limit(20);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    totalStock: Number(row.total_stock ?? 0),
  }));
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

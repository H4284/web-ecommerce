import Link from "next/link";
import { adminCopy } from "@/content/admin";
import type { AdminDashboard } from "@/lib/shop/admin-dashboard";
import { LOW_STOCK_THRESHOLD } from "@/lib/shop/admin-dashboard";
import { formatOrderDate, orderStatusLabel } from "@/lib/shop/admin-order-labels";
import { formatCents } from "@/lib/shop/money";

type AdminDashboardViewProps = {
  data: AdminDashboard;
};


export function AdminDashboardView({ data }: AdminDashboardViewProps) {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl tracking-display text-ink">
          {adminCopy.dashboard}
        </h1>
        <p className="mt-3 text-ink-muted">{adminCopy.dashboardBody}</p>
        <p className="mt-2 text-sm text-ink-muted">
          {adminCopy.signedInAs}{" "}
          <span className="font-medium text-ink">{data.email}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <PeriodCard title={adminCopy.dashToday} stats={data.today} />
        <PeriodCard title={adminCopy.dashDays7} stats={data.days7} />
        <PeriodCard title={adminCopy.dashDays30} stats={data.days30} />
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">{adminCopy.dashLatestOrders}</h2>
        {data.latestOrders.length === 0 ? (
          <p className="text-sm text-ink-muted">{adminCopy.dashEmptyOrders}</p>
        ) : (
          <ul className="divide-y divide-border border border-border bg-surface">
            {data.latestOrders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
              >
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-medium text-ink underline-offset-4 hover:underline"
                >
                  {order.number}
                </Link>
                <span className="text-ink-muted">
                  {formatOrderDate(order.createdAt)}
                </span>
                <span className="text-ink">{order.customerName}</span>
                <span className="ml-auto font-medium text-ink">
                  {formatCents(order.totalCents)}
                </span>
                <span className="text-ink-muted">
                  {orderStatusLabel(order.status)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">
          {adminCopy.dashLowStock} (≤ {LOW_STOCK_THRESHOLD})
        </h2>
        {data.lowStock.length === 0 ? (
          <p className="text-sm text-ink-muted">{adminCopy.dashLowStockEmpty}</p>
        ) : (
          <ul className="divide-y divide-border border border-border bg-surface">
            {data.lowStock.map((product) => (
              <li
                key={product.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
              >
                <Link
                  href={`/admin/products/${product.id}`}
                  className="font-medium text-ink underline-offset-4 hover:underline"
                >
                  {product.name}
                </Link>
                <span className="text-ink-muted">{product.slug}</span>
                <span className="ml-auto font-medium text-ink">
                  {product.totalStock}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PeriodCard({
  title,
  stats,
}: {
  title: string;
  stats: AdminDashboard["today"];
}) {
  return (
    <div className="border border-border bg-surface p-4">
      <h2 className="text-sm font-medium tracking-wide text-ink-muted uppercase">
        {title}
      </h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-muted">{adminCopy.dashOrders}</dt>
          <dd className="font-medium text-ink">{stats.orders}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-muted">{adminCopy.dashRevenue}</dt>
          <dd className="font-medium text-ink">
            {formatCents(stats.revenueCents)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-muted">{adminCopy.dashAverage}</dt>
          <dd className="font-medium text-ink">
            {formatCents(stats.averageCents)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

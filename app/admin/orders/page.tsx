import type { Metadata } from "next";
import { OrdersTable } from "@/components/admin/orders-table";
import { adminCopy } from "@/content/admin";
import { requireAdmin } from "@/lib/shop/auth";
import { listAdminOrders } from "@/lib/shop/admin-orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: adminCopy.orders };

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await listAdminOrders();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl tracking-display text-ink">
        {adminCopy.orders}
      </h1>
      <OrdersTable orders={orders} />
    </div>
  );
}

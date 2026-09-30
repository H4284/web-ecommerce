import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderDetail } from "@/components/admin/order-detail";
import { adminCopy } from "@/content/admin";
import { requireAdmin } from "@/lib/shop/auth";
import { getAdminOrder } from "@/lib/shop/admin-orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: adminCopy.orderDetail };

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const bankPortalUrl = process.env.BANK_PORTAL_URL?.trim() || null;

  return <OrderDetail order={order} bankPortalUrl={bankPortalUrl} />;
}

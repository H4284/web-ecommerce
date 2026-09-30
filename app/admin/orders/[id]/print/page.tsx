import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminCopy } from "@/content/admin";
import { requireAdmin } from "@/lib/shop/auth";
import {
  formatOrderDate,
  orderStatusLabel,
  paymentStatusLabel,
} from "@/lib/shop/admin-order-labels";
import { getAdminOrder } from "@/lib/shop/admin-orders";
import { formatCents } from "@/lib/shop/money";
import { getShopSettingsUncached } from "@/lib/shop/settings-queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: adminCopy.orderPrintTitle };

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderPrintPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const [order, settings] = await Promise.all([
    getAdminOrder(id),
    getShopSettingsUncached(),
  ]);
  if (!order) notFound();

  const company = settings.company;

  return (
    <div className="mx-auto max-w-3xl bg-surface p-8 text-ink print:p-0">
      <style>{`@media print { nav, aside, header, .admin-shell-nav { display: none !important; } }`}</style>
      <header className="mb-8 border-b border-border pb-4">
        <h1 className="font-display text-2xl tracking-display">{company.name}</h1>
        <p className="mt-1 text-sm text-ink-muted">{company.address}</p>
        <p className="text-sm text-ink-muted">
          {company.email} · {company.phone}
        </p>
        {company.iban ? (
          <p className="text-sm text-ink-muted">IBAN: {company.iban}</p>
        ) : null}
      </header>

      <h2 className="font-display text-xl">{adminCopy.orderPrintTitle}</h2>
      <p className="mt-2 text-sm">
        {order.number} · {formatOrderDate(order.createdAt)}
      </p>
      <p className="text-sm text-ink-muted">
        {orderStatusLabel(order.status)} · {paymentStatusLabel(order.paymentStatus)} ·{" "}
        {order.paymentMethodId}
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="text-sm">
          <h3 className="font-medium">{adminCopy.orderDelivery}</h3>
          <p>{order.delivery.recipient}</p>
          <p>{order.delivery.address}</p>
          <p>
            {order.delivery.postalCode ? `${order.delivery.postalCode} ` : ""}
            {order.delivery.city}
          </p>
          <p>{order.delivery.phone}</p>
        </div>
        <div className="text-sm">
          <h3 className="font-medium">{adminCopy.orderColCustomer}</h3>
          <p>{order.customer.name}</p>
          <p>{order.customer.email}</p>
          <p>{order.customer.phone ?? order.delivery.phone}</p>
        </div>
      </div>

      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 pr-2">SKU</th>
            <th className="py-2 pr-2">{adminCopy.productColName}</th>
            <th className="py-2 pr-2">Qty</th>
            <th className="py-2 text-right">{adminCopy.orderColTotal}</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line) => (
            <tr
              key={`${line.productId}-${line.variantId}`}
              className="border-b border-border"
            >
              <td className="py-2 pr-2">{line.sku}</td>
              <td className="py-2 pr-2">
                {line.name}
                {line.variantLabel ? ` (${line.variantLabel})` : ""}
              </td>
              <td className="py-2 pr-2">{line.qty}</td>
              <td className="py-2 text-right">
                {formatCents(line.priceCents * line.qty)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span>{adminCopy.orderSubtotal}</span>
          <span>{formatCents(order.subtotalCents)}</span>
        </div>
        {order.discountAmountCents > 0 ? (
          <div className="flex justify-between">
            <span>{adminCopy.orderDiscount}</span>
            <span>−{formatCents(order.discountAmountCents)}</span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span>{adminCopy.orderDeliveryFee}</span>
          <span>{formatCents(order.deliveryCents)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>{adminCopy.orderTotal}</span>
          <span>{formatCents(order.totalCents)}</span>
        </div>
      </div>
    </div>
  );
}

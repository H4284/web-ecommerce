"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminCopy } from "@/content/admin";
import {
  markOrderPaidAction,
  updateOrderNoteAction,
  updateOrderStatusAction,
} from "@/app/admin/orders/actions";
import {
  formatOrderDate,
  orderStatusLabel,
  paymentStatusLabel,
} from "@/lib/shop/admin-order-labels";
import { ORDER_STATUSES } from "@/lib/shop/admin-order-schema";
import type { AdminOrder } from "@/lib/shop/admin-order-schema";
import { formatCents } from "@/lib/shop/money";

type OrderDetailProps = {
  order: AdminOrder;
  bankPortalUrl: string | null;
};

export function OrderDetail({ order, bankPortalUrl }: OrderDetailProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState("");
  const [internalNote, setInternalNote] = useState(order.internalNote);
  const [message, setMessage] = useState<string | null>(null);

  function refresh(ok: boolean) {
    setMessage(ok ? adminCopy.orderSaveOk : adminCopy.orderSaveFail);
    if (ok) router.refresh();
  }

  function onStatus() {
    startTransition(async () => {
      const result = await updateOrderStatusAction({
        orderId: order.id,
        status,
        note,
      });
      if (result.ok) setNote("");
      refresh(result.ok);
    });
  }

  function onMarkPaid() {
    startTransition(async () => {
      const result = await markOrderPaidAction({
        orderId: order.id,
        note: "Marked paid",
      });
      refresh(result.ok);
    });
  }

  function onNote() {
    startTransition(async () => {
      const result = await updateOrderNoteAction({
        orderId: order.id,
        internalNote,
      });
      refresh(result.ok);
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/orders"
            className="text-sm text-ink-muted underline-offset-4 hover:underline"
          >
            {adminCopy.orderBack}
          </Link>
          <h1 className="mt-2 font-display text-3xl tracking-display text-ink">
            {order.number}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {formatOrderDate(order.createdAt)} · {orderStatusLabel(order.status)} ·{" "}
            {paymentStatusLabel(order.paymentStatus)}
          </p>
        </div>
        <Link
          href={`/admin/orders/${order.id}/print`}
          className="rounded-md border border-border px-4 py-2 text-sm text-ink"
          target="_blank"
        >
          {adminCopy.orderPrint}
        </Link>
      </div>

      {message ? (
        <p className="text-sm text-ink-muted" role="status">
          {message}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">{adminCopy.orderLines}</h2>
        <ul className="divide-y divide-border border border-border">
          {order.lines.map((line) => (
            <li
              key={`${line.productId}-${line.variantId}`}
              className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm"
            >
              <div>
                <div className="font-medium text-ink">{line.name}</div>
                <div className="text-ink-muted">
                  {line.variantLabel} · {line.sku} · ×{line.qty}
                </div>
              </div>
              <div className="text-ink">{formatCents(line.priceCents * line.qty)}</div>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <AddressBlock title={adminCopy.orderDelivery} address={order.delivery} />
        <AddressBlock
          title={adminCopy.orderBilling}
          address={
            order.billingSameAsDelivery || !order.billing
              ? order.delivery
              : order.billing
          }
        />
      </div>

      <section className="space-y-2 text-sm">
        <h2 className="font-display text-xl text-ink">{adminCopy.orderTotals}</h2>
        <Row label={adminCopy.orderSubtotal} value={formatCents(order.subtotalCents)} />
        {order.discountAmountCents > 0 ? (
          <Row
            label={adminCopy.orderDiscount}
            value={`−${formatCents(order.discountAmountCents)}`}
          />
        ) : null}
        <Row label={adminCopy.orderDeliveryFee} value={formatCents(order.deliveryCents)} />
        <Row label={adminCopy.orderTotal} value={formatCents(order.totalCents)} bold />
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="font-display text-xl text-ink">{adminCopy.orderPayment}</h2>
        <p>
          {order.paymentMethodId} · {paymentStatusLabel(order.paymentStatus)}
        </p>
        {order.bankTransactionId ? (
          <p>
            {adminCopy.orderBankTx}: {order.bankTransactionId}
          </p>
        ) : null}
        {order.bankLast4 ? (
          <p>
            {adminCopy.orderBankLast4}: •••• {order.bankLast4}
          </p>
        ) : null}
        {bankPortalUrl ? (
          <a
            href={bankPortalUrl}
            target="_blank"
            rel="noreferrer"
            className="text-ink underline-offset-4 hover:underline"
          >
            {adminCopy.orderBankPortal}
          </a>
        ) : null}
        {order.paymentMethodId === "transfer" &&
        order.paymentStatus !== "paid" ? (
          <button
            type="button"
            onClick={onMarkPaid}
            disabled={pending}
            className="mt-2 rounded-md bg-ink px-4 py-2 text-surface disabled:opacity-50"
          >
            {adminCopy.orderMarkPaid}
          </button>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">{adminCopy.orderStatusChange}</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-muted">{adminCopy.orderFilterStatus}</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-2 text-ink"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {orderStatusLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[14rem] flex-1 flex-col gap-1 text-sm">
            <span className="text-ink-muted">{adminCopy.orderStatusNote}</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-2 text-ink"
            />
          </label>
          <button
            type="button"
            onClick={onStatus}
            disabled={pending}
            className="rounded-md bg-ink px-4 py-2 text-sm text-surface disabled:opacity-50"
          >
            {adminCopy.orderStatusSubmit}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">{adminCopy.orderInternalNote}</h2>
        <textarea
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink"
        />
        <button
          type="button"
          onClick={onNote}
          disabled={pending}
          className="rounded-md border border-border px-4 py-2 text-sm text-ink disabled:opacity-50"
        >
          {adminCopy.orderNoteSave}
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">{adminCopy.orderTimeline}</h2>
        <ol className="space-y-2 border-l border-border pl-4 text-sm">
          {[...order.timeline]
            .sort((a, b) => a.at.localeCompare(b.at))
            .map((entry, i) => (
              <li key={`${entry.at}-${entry.status}-${i}`}>
                <div className="font-medium text-ink">
                  {orderStatusLabel(entry.status)} · {formatOrderDate(entry.at)}
                </div>
                <div className="text-ink-muted">
                  {entry.by}
                  {entry.note ? ` — ${entry.note}` : ""}
                </div>
              </li>
            ))}
        </ol>
      </section>
    </div>
  );
}

function AddressBlock({
  title,
  address,
}: {
  title: string;
  address: AdminOrder["delivery"];
}) {
  return (
    <section className="space-y-1 text-sm">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <p className="text-ink">{address.recipient}</p>
      <p className="text-ink-muted">{address.address}</p>
      <p className="text-ink-muted">
        {address.postalCode ? `${address.postalCode} ` : ""}
        {address.city}, {address.country}
      </p>
      <p className="text-ink-muted">{address.phone}</p>
    </section>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-4 ${bold ? "font-medium text-ink" : "text-ink-muted"}`}>
      <span>{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}

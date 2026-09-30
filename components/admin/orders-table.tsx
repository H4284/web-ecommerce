"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { adminCopy } from "@/content/admin";
import { exportOrdersCsvAction } from "@/app/admin/orders/actions";
import {
  formatOrderDate,
  orderStatusLabel,
  paymentStatusLabel,
} from "@/lib/shop/admin-order-labels";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/shop/admin-order-schema";
import type { AdminOrder } from "@/lib/shop/admin-order-schema";
import { formatCents } from "@/lib/shop/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type OrdersTableProps = {
  orders: AdminOrder[];
};

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, AdminOrder>();

export function OrdersTable({ orders }: OrdersTableProps) {
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const fromMs = from ? Date.parse(from) : NaN;
    const toMs = to ? Date.parse(to) : NaN;
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (paymentStatus !== "all" && o.paymentStatus !== paymentStatus) {
        return false;
      }
      const createdMs = Date.parse(o.createdAt);
      if (Number.isFinite(fromMs) && createdMs < fromMs) return false;
      if (Number.isFinite(toMs) && createdMs > toMs + 86_400_000 - 1) return false;
      if (!needle) return true;
      const hay = [
        o.number,
        o.customer.email,
        o.customer.phone ?? "",
        o.customer.name,
        o.delivery.phone,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [orders, q, status, paymentStatus, from, to]);

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor("number", {
          header: adminCopy.orderColNumber,
          cell: ({ row }) => (
            <Link
              href={`/admin/orders/${row.original.id}`}
              className="font-medium text-ink underline-offset-4 hover:underline"
            >
              {row.original.number}
            </Link>
          ),
        }),
        helper.accessor("createdAt", {
          header: adminCopy.orderColDate,
          cell: ({ getValue }) => formatOrderDate(getValue()),
        }),
        helper.display({
          id: "customer",
          header: adminCopy.orderColCustomer,
          cell: ({ row }) => (
            <div>
              <div>{row.original.customer.name}</div>
              <div className="text-xs text-ink-muted">{row.original.customer.email}</div>
            </div>
          ),
        }),
        helper.accessor("totalCents", {
          header: adminCopy.orderColTotal,
          cell: ({ getValue }) => formatCents(getValue()),
        }),
        helper.accessor("status", {
          header: adminCopy.orderColStatus,
          cell: ({ getValue }) => orderStatusLabel(getValue()),
        }),
        helper.accessor("paymentStatus", {
          header: adminCopy.orderColPayment,
          cell: ({ getValue }) => paymentStatusLabel(getValue()),
        }),
      ]),
    [],
  );

  const table = useTable({
    features,
    columns,
    data: filtered,
    getRowId: (row) => row.id,
  });

  function downloadCsv() {
    startTransition(async () => {
      const result = await exportOrdersCsvAction({
        status: status as "all" | (typeof ORDER_STATUSES)[number],
        paymentStatus: paymentStatus as
          | "all"
          | (typeof PAYMENT_STATUSES)[number],
        q,
        from,
        to,
      });
      if (!result.ok) return;
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "orders.csv";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-sm">
          <span className="text-ink-muted">{adminCopy.orderSearch}</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-ink"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-muted">{adminCopy.orderFilterStatus}</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-ink"
          >
            <option value="all">{adminCopy.orderAll}</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {orderStatusLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-muted">{adminCopy.orderFilterPayment}</span>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-ink"
          >
            <option value="all">{adminCopy.orderAll}</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {paymentStatusLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-muted">{adminCopy.orderFilterFrom}</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-ink"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-muted">{adminCopy.orderFilterTo}</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-ink"
          />
        </label>
        <button
          type="button"
          onClick={downloadCsv}
          disabled={pending}
          className="rounded-md bg-ink px-4 py-2 text-sm text-surface disabled:opacity-50"
        >
          {adminCopy.orderExportCsv}
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-ink-muted">{adminCopy.orderEmpty}</p>
      ) : (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

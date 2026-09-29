"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  filterFn_includesString,
  rowSelectionFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { adminCopy } from "@/content/admin";
import { formatCents } from "@/lib/shop/money";
import type { AdminProductRow } from "@/lib/shop/admin-products";
import { bulkStatusAction } from "@/app/admin/products/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type BrandOpt = { id: string; name: string };
type CategoryOpt = { id: string; name: string };

type ProductsTableProps = {
  products: AdminProductRow[];
  brands: BrandOpt[];
  categories: CategoryOpt[];
};

const features = tableFeatures({
  columnFilteringFeature,
  rowSelectionFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
});

const helper = createColumnHelper<typeof features, AdminProductRow>();

function statusLabel(status: AdminProductRow["status"]): string {
  if (status === "active") return adminCopy.productStatusActive;
  if (status === "archived") return adminCopy.productStatusArchived;
  return adminCopy.productStatusDraft;
}

export function ProductsTable({ products, brands, categories }: ProductsTableProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [brandId, setBrandId] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (brandId !== "all" && p.brandId !== brandId) return false;
      if (categoryId !== "all" && !p.categoryIds.includes(categoryId)) return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        p.slug.toLowerCase().includes(needle)
      );
    });
  }, [products, q, status, brandId, categoryId]);

  const columns = useMemo(
    () =>
      helper.columns([
        helper.display({
          id: "select",
          header: () => null,
          cell: ({ row }) => (
            <input
              type="checkbox"
              checked={Boolean(selected[row.original.id])}
              onChange={(e) =>
                setSelected((prev) => ({
                  ...prev,
                  [row.original.id]: e.target.checked,
                }))
              }
              aria-label={row.original.name}
            />
          ),
        }),
        helper.accessor("name", {
          header: adminCopy.productColName,
          cell: ({ row }) => (
            <Link
              href={`/admin/products/${row.original.id}`}
              className="font-medium text-ink underline-offset-4 hover:underline"
            >
              {row.original.name}
            </Link>
          ),
        }),
        helper.accessor("status", {
          header: adminCopy.productColStatus,
          cell: ({ getValue }) => statusLabel(getValue()),
        }),
        helper.accessor("totalStock", {
          header: adminCopy.productColStock,
        }),
        helper.accessor("minPriceCents", {
          header: adminCopy.productColPrice,
          cell: ({ getValue }) => formatCents(getValue()),
        }),
        helper.accessor("updatedAt", {
          header: adminCopy.productColUpdated,
          cell: ({ getValue }) => getValue().slice(0, 10),
        }),
      ]),
    [selected],
  );

  const table = useTable({
    features,
    columns,
    data: filtered,
  });

  const selectedIds = Object.entries(selected)
    .filter(([, v]) => v)
    .map(([id]) => id);

  function runBulk(next: "active" | "archived") {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      await bulkStatusAction({ ids: selectedIds, status: next });
      setSelected({});
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.productSearch}</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="min-h-11 min-w-48 border border-border bg-surface px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.productFilterStatus}</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="min-h-11 border border-border bg-surface px-3"
          >
            <option value="all">{adminCopy.productAll}</option>
            <option value="active">{adminCopy.productStatusActive}</option>
            <option value="draft">{adminCopy.productStatusDraft}</option>
            <option value="archived">{adminCopy.productStatusArchived}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.productFilterBrand}</span>
          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="min-h-11 border border-border bg-surface px-3"
          >
            <option value="all">{adminCopy.productAll}</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.productFilterCategory}</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="min-h-11 border border-border bg-surface px-3"
          >
            <option value="all">{adminCopy.productAll}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={pending || selectedIds.length === 0}
          onClick={() => runBulk("active")}
          className="min-h-11 bg-ink px-4 text-sm text-on-accent disabled:opacity-50"
        >
          {adminCopy.productBulkActivate}
        </button>
        <button
          type="button"
          disabled={pending || selectedIds.length === 0}
          onClick={() => runBulk("archived")}
          className="min-h-11 border border-border px-4 text-sm disabled:opacity-50"
        >
          {adminCopy.productBulkArchive}
        </button>
        <Link
          href="/admin/products/new"
          className="ml-auto inline-flex min-h-11 items-center bg-accent px-4 text-sm font-medium text-on-accent"
        >
          {adminCopy.productNew}
        </Link>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-ink-muted">{adminCopy.productEmpty}</p>
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

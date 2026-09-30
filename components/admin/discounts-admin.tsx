"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminCopy } from "@/content/admin";
import type { AdminDiscount } from "@/lib/shop/admin-discount-schema";
import {
  saveDiscountAction,
  setDiscountActiveAction,
} from "@/app/admin/discounts/actions";

type DiscountsAdminProps = {
  discounts: AdminDiscount[];
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string {
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function typeLabel(type: AdminDiscount["type"]): string {
  if (type === "percent") return adminCopy.discountTypePercent;
  if (type === "fixed") return adminCopy.discountTypeFixed;
  return adminCopy.discountTypeFreeDelivery;
}

export function DiscountsAdmin({ discounts }: DiscountsAdminProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editing = useMemo(
    () =>
      editingId && editingId !== "new"
        ? discounts.find((d) => d.code === editingId) ?? null
        : null,
    [discounts, editingId],
  );

  const [code, setCode] = useState("");
  const [type, setType] = useState<AdminDiscount["type"]>("percent");
  const [value, setValue] = useState(10);
  const [minSubtotalCents, setMinSubtotalCents] = useState(0);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [usageLimit, setUsageLimit] = useState<string>("");
  const [active, setActive] = useState(true);

  function openNew() {
    const now = new Date();
    const end = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    setEditingId("new");
    setCode("");
    setType("percent");
    setValue(10);
    setMinSubtotalCents(0);
    setStartsAt(toLocalInput(now.toISOString()));
    setEndsAt(toLocalInput(end.toISOString()));
    setUsageLimit("");
    setActive(true);
    setMessage(null);
    setError(null);
  }

  function openEdit(d: AdminDiscount) {
    setEditingId(d.code);
    setCode(d.code);
    setType(d.type);
    setValue(d.value);
    setMinSubtotalCents(d.minSubtotalCents);
    setStartsAt(toLocalInput(d.startsAt));
    setEndsAt(toLocalInput(d.endsAt));
    setUsageLimit(d.usageLimit == null ? "" : String(d.usageLimit));
    setActive(d.active);
    setMessage(null);
    setError(null);
  }

  function run(fn: () => Promise<void>) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  const showForm = editingId !== null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {discounts.length} {adminCopy.discounts.toLowerCase()}
        </p>
        <button
          type="button"
          onClick={openNew}
          className="min-h-11 bg-accent px-4 text-sm font-medium text-on-accent"
        >
          {adminCopy.discountNew}
        </button>
      </div>

      {discounts.length === 0 ? (
        <p className="text-sm text-ink-muted">{adminCopy.discountEmpty}</p>
      ) : (
        <ul className="divide-y divide-border border border-border bg-surface">
          {discounts.map((d) => (
            <li
              key={d.code}
              className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{d.code}</p>
                <p className="text-ink-muted">
                  {typeLabel(d.type)}
                  {d.type === "percent"
                    ? ` ${d.value}%`
                    : d.type === "fixed"
                      ? ` ${d.value}c`
                      : ""}{" "}
                  · {adminCopy.discountUsedCount}: {d.usedCount}
                  {d.usageLimit != null ? ` / ${d.usageLimit}` : ""} ·{" "}
                  {d.active ? adminCopy.discountActive : adminCopy.discountInactive}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openEdit(d)}
                className="min-h-10 border border-border px-3"
              >
                {adminCopy.discountEdit}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    const result = await setDiscountActiveAction({
                      code: d.code,
                      active: !d.active,
                    });
                    if (!result.ok) {
                      setError(adminCopy.discountSaveFail);
                      return;
                    }
                    setMessage(adminCopy.discountSaved);
                  })
                }
                className="min-h-10 border border-border px-3 disabled:opacity-50"
              >
                {d.active ? adminCopy.discountTurnOff : adminCopy.discountTurnOn}
              </button>
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <form
          className="flex max-w-xl flex-col gap-3 border border-border bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const limitRaw = usageLimit.trim();
              const result = await saveDiscountAction({
                code,
                type,
                value: type === "free_delivery" ? 0 : value,
                minSubtotalCents,
                startsAt: fromLocalInput(startsAt),
                endsAt: fromLocalInput(endsAt),
                usageLimit: limitRaw === "" ? null : Number(limitRaw),
                active,
              });
              if (!result.ok) {
                setError(adminCopy.discountSaveFail);
                return;
              }
              setMessage(adminCopy.discountSaved);
              setEditingId(null);
            });
          }}
        >
          <h2 className="font-display text-xl text-ink">
            {editingId === "new" ? adminCopy.discountNew : adminCopy.discountEdit}
          </h2>
          {editingId !== "new" ? (
            <p className="text-xs text-ink-muted">{adminCopy.discountCodeLocked}</p>
          ) : null}

          <label className="flex flex-col gap-1 text-sm">
            <span>{adminCopy.discountCode}</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={editingId !== "new"}
              required
              className="min-h-11 border border-border bg-surface px-3 uppercase disabled:opacity-60"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>{adminCopy.discountType}</span>
            <select
              value={type}
              onChange={(e) => {
                const next = e.target.value as AdminDiscount["type"];
                setType(next);
                if (next === "free_delivery") setValue(0);
                if (next === "percent" && (value < 1 || value > 100)) setValue(10);
              }}
              className="min-h-11 border border-border bg-surface px-3"
            >
              <option value="percent">{adminCopy.discountTypePercent}</option>
              <option value="fixed">{adminCopy.discountTypeFixed}</option>
              <option value="free_delivery">
                {adminCopy.discountTypeFreeDelivery}
              </option>
            </select>
          </label>

          {type !== "free_delivery" ? (
            <label className="flex flex-col gap-1 text-sm">
              <span>{adminCopy.discountValue}</span>
              <input
                type="number"
                min={type === "percent" ? 1 : 0}
                max={type === "percent" ? 100 : undefined}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="min-h-11 border border-border bg-surface px-3"
              />
            </label>
          ) : null}

          <label className="flex flex-col gap-1 text-sm">
            <span>{adminCopy.discountMinSubtotal}</span>
            <input
              type="number"
              min={0}
              value={minSubtotalCents}
              onChange={(e) => setMinSubtotalCents(Number(e.target.value))}
              className="min-h-11 border border-border bg-surface px-3"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>{adminCopy.discountStartsAt}</span>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
              className="min-h-11 border border-border bg-surface px-3"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>{adminCopy.discountEndsAt}</span>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              required
              className="min-h-11 border border-border bg-surface px-3"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>
              {adminCopy.discountUsageLimit} ({adminCopy.discountUsageUnlimited})
            </span>
            <input
              type="number"
              min={1}
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              placeholder={adminCopy.discountUsageUnlimited}
              className="min-h-11 border border-border bg-surface px-3"
            />
          </label>

          {editing ? (
            <p className="text-sm text-ink-muted">
              {adminCopy.discountUsedCount}: {editing.usedCount}
            </p>
          ) : null}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span>{adminCopy.discountActive}</span>
          </label>

          {message ? (
            <p className="text-sm text-ink-muted" role="status">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="min-h-11 bg-ink px-4 text-sm text-surface disabled:opacity-50"
            >
              {pending ? adminCopy.discountSaving : adminCopy.discountSave}
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="min-h-11 border border-border px-4 text-sm"
            >
              ←
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

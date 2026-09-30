"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminCopy } from "@/content/admin";
import { slugify } from "@/lib/shop/slug";
import type { AdminCategory } from "@/lib/shop/admin-taxonomy";
import {
  archiveCategoryAction,
  deleteCategoryAction,
  moveCategoryAction,
  saveCategoryAction,
} from "@/app/admin/taxonomy-actions";

type CategoriesAdminProps = {
  categories: AdminCategory[];
};

export function CategoriesAdmin({ categories }: CategoriesAdminProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editing = useMemo(
    () =>
      editingId && editingId !== "new"
        ? categories.find((c) => c.id === editingId) ?? null
        : null,
    [categories, editingId],
  );

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [parentId, setParentId] = useState<string>("");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  function openNew() {
    setEditingId("new");
    setName("");
    setSlug("");
    setSlugTouched(false);
    setParentId("");
    setOrder(
      categories.length
        ? Math.max(...categories.map((c) => c.order)) + 1
        : 0,
    );
    setIsActive(true);
    setSeoTitle("");
    setSeoDescription("");
    setMessage(null);
    setError(null);
  }

  function openEdit(cat: AdminCategory) {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setSlugTouched(true);
    setParentId(cat.parentId ?? "");
    setOrder(cat.order);
    setIsActive(cat.isActive);
    setSeoTitle(cat.seo?.title ?? "");
    setSeoDescription(cat.seo?.description ?? "");
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {categories.length} {adminCopy.categories.toLowerCase()}
        </p>
        <button
          type="button"
          onClick={openNew}
          className="min-h-11 bg-accent px-4 text-sm font-medium text-on-accent"
        >
          {adminCopy.taxNewCategory}
        </button>
      </div>

      <ul className="divide-y divide-border border border-border bg-surface">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">
                {cat.parentId ? "↳ " : ""}
                {cat.name}
              </p>
              <p className="text-ink-muted">
                {cat.slug} · {adminCopy.taxOrder} {cat.order} ·{" "}
                {cat.isActive ? adminCopy.taxActive : adminCopy.taxInactive} ·{" "}
                {cat.productCount} {adminCopy.taxProducts.toLowerCase()}
              </p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await moveCategoryAction({ id: cat.id, direction: "up" });
                })
              }
              className="min-h-10 border border-border px-3 disabled:opacity-50"
            >
              {adminCopy.taxMoveUp}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await moveCategoryAction({ id: cat.id, direction: "down" });
                })
              }
              className="min-h-10 border border-border px-3 disabled:opacity-50"
            >
              {adminCopy.taxMoveDown}
            </button>
            <button
              type="button"
              onClick={() => openEdit(cat)}
              className="min-h-10 border border-border px-3"
            >
              {adminCopy.taxEditCategory}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await archiveCategoryAction({ id: cat.id });
                  setMessage(adminCopy.taxSaved);
                })
              }
              className="min-h-10 border border-border px-3 disabled:opacity-50"
            >
              {adminCopy.taxArchive}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const result = await deleteCategoryAction({ id: cat.id });
                  if (!result.ok) {
                    setError(
                      result.error === "in_use"
                        ? adminCopy.taxInUse
                        : adminCopy.taxSaveFail,
                    );
                    return;
                  }
                  setMessage(adminCopy.taxSaved);
                })
              }
              className="min-h-10 border border-border px-3 text-danger disabled:opacity-50"
            >
              {adminCopy.taxDelete}
            </button>
          </li>
        ))}
      </ul>

      {editingId ? (
        <form
          className="flex max-w-xl flex-col gap-3 border border-border bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const result = await saveCategoryAction({
                id: editingId === "new" ? null : editingId,
                name,
                slug,
                parentId: parentId || null,
                order,
                isActive,
                image: editing?.image ?? null,
                seoTitle,
                seoDescription,
              });
              if (!result.ok) {
                setError(adminCopy.taxSaveFail);
                return;
              }
              setMessage(adminCopy.taxSaved);
              setEditingId(null);
            });
          }}
        >
          <h2 className="font-display text-xl tracking-display">
            {editingId === "new"
              ? adminCopy.taxNewCategory
              : adminCopy.taxEditCategory}
          </h2>
          <label className="flex flex-col gap-1 text-sm">
            <span>{adminCopy.taxName}</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
              className="min-h-11 border border-border px-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>{adminCopy.taxSlug}</span>
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              required
              className="min-h-11 border border-border px-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>{adminCopy.taxParent}</span>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="min-h-11 border border-border px-3"
            >
              <option value="">{adminCopy.taxParentNone}</option>
              {categories
                .filter((c) => c.id !== editingId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>{adminCopy.taxOrder}</span>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value) || 0)}
              className="min-h-11 border border-border px-3"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            {adminCopy.taxActive}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>{adminCopy.taxSeoTitle}</span>
            <input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className="min-h-11 border border-border px-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>{adminCopy.taxSeoDescription}</span>
            <input
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              className="min-h-11 border border-border px-3"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="min-h-11 bg-ink px-4 text-sm text-on-accent disabled:opacity-50"
            >
              {pending ? adminCopy.taxSaving : adminCopy.taxSave}
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="min-h-11 border border-border px-4 text-sm"
            >
              Dil
            </button>
          </div>
        </form>
      ) : null}

      {message ? <p className="text-sm text-ink">{message}</p> : null}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

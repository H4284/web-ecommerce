"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminCopy } from "@/content/admin";
import { slugify } from "@/lib/shop/slug";
import type { AdminBrand } from "@/lib/shop/admin-taxonomy";
import {
  archiveBrandAction,
  deleteBrandAction,
  saveBrandAction,
} from "@/app/admin/taxonomy-actions";

type BrandsAdminProps = {
  brands: AdminBrand[];
};

export function BrandsAdmin({ brands }: BrandsAdminProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editing = useMemo(
    () =>
      editingId && editingId !== "new"
        ? brands.find((b) => b.id === editingId) ?? null
        : null,
    [brands, editingId],
  );

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  function openNew() {
    setEditingId("new");
    setName("");
    setSlug("");
    setSlugTouched(false);
    setDescription("");
    setIsActive(true);
    setSeoTitle("");
    setSeoDescription("");
    setMessage(null);
    setError(null);
  }

  function openEdit(brand: AdminBrand) {
    setEditingId(brand.id);
    setName(brand.name);
    setSlug(brand.slug);
    setSlugTouched(true);
    setDescription(brand.description ?? "");
    setIsActive(brand.isActive);
    setSeoTitle(brand.seo?.title ?? "");
    setSeoDescription(brand.seo?.description ?? "");
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
          {brands.length} {adminCopy.brands.toLowerCase()}
        </p>
        <button
          type="button"
          onClick={openNew}
          className="min-h-11 bg-accent px-4 text-sm font-medium text-on-accent"
        >
          {adminCopy.taxNewBrand}
        </button>
      </div>

      <ul className="divide-y divide-border border border-border bg-surface">
        {brands.map((brand) => (
          <li
            key={brand.id}
            className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">{brand.name}</p>
              <p className="text-ink-muted">
                {brand.slug} ·{" "}
                {brand.isActive ? adminCopy.taxActive : adminCopy.taxInactive} ·{" "}
                {brand.productCount} {adminCopy.taxProducts.toLowerCase()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openEdit(brand)}
              className="min-h-10 border border-border px-3"
            >
              {adminCopy.taxEditBrand}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await archiveBrandAction({ id: brand.id });
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
                  const result = await deleteBrandAction({ id: brand.id });
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
              const result = await saveBrandAction({
                id: editingId === "new" ? null : editingId,
                name,
                slug,
                description,
                isActive,
                logo: editing?.logo ?? null,
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
            {editingId === "new" ? adminCopy.taxNewBrand : adminCopy.taxEditBrand}
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
            <span>{adminCopy.taxDescription}</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="border border-border px-3 py-2"
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

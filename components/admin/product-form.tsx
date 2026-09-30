"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { adminCopy } from "@/content/admin";
import {
  expandOptionCombos,
  variantIdFromOptions,
  type SaveProductInput,
} from "@/lib/shop/admin-product-schema";
import { slugify } from "@/lib/shop/slug";
import type { AdminProductDetail } from "@/lib/shop/admin-products";
import type { ImageRef } from "@/lib/shop/schemas";
import {
  saveProductAction,
  updateStockAction,
} from "@/app/admin/products/actions";
import { ProductImageEditor } from "@/components/admin/product-image-editor";
import { cn } from "cn";

type Opt = { id: string; name: string };

type ProductFormProps = {
  product: AdminProductDetail | null;
  brands: Opt[];
  categories: Opt[];
};

type OptionDraft = { name: string; valuesText: string };

type VariantDraft = {
  id: string;
  sku: string;
  optionValues: Record<string, string>;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  loadedStock: number;
  isDefault: boolean;
  isNew: boolean;
};

function buildVariants(
  options: OptionDraft[],
  existing: AdminProductDetail["variants"] | undefined,
): VariantDraft[] {
  const parsed = options
    .filter((o) => o.name.trim() && o.valuesText.trim())
    .map((o) => ({
      name: o.name.trim(),
      values: o.valuesText
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    }))
    .filter((o) => o.values.length > 0)
    .slice(0, 2);

  const combos = expandOptionCombos(parsed);
  return combos.map((optionValues, i) => {
    const id = Object.keys(optionValues).length
      ? variantIdFromOptions(optionValues)
      : "default";
    const prev = existing?.find((v) => v.id === id);
    return {
      id,
      sku: prev?.sku ?? `${id.toUpperCase()}-${i + 1}`,
      optionValues,
      priceCents: prev?.priceCents ?? 0,
      compareAtCents: prev?.compareAtCents ?? null,
      stock: prev?.stock ?? 0,
      loadedStock: prev?.stock ?? 0,
      isDefault: prev?.isDefault ?? i === 0,
      isNew: !prev,
    };
  });
}

export function ProductForm({ product, brands, categories }: ProductFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [brandId, setBrandId] = useState(product?.brandId ?? brands[0]?.id ?? "");
  const [categoryIds, setCategoryIds] = useState<string[]>(
    product?.categoryIds ?? (categories[0] ? [categories[0].id] : []),
  );
  const [shortDescription, setShortDescription] = useState(
    product?.shortDescription ?? "",
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [status, setStatus] = useState<SaveProductInput["status"]>(
    product?.status ?? "draft",
  );
  const [isNew, setIsNew] = useState(product?.isNew ?? false);
  const [isBestSeller, setIsBestSeller] = useState(product?.isBestSeller ?? false);
  const [unitAmount, setUnitAmount] = useState(
    product?.unit?.amount?.toString() ?? "",
  );
  const [unitLabel, setUnitLabel] = useState(product?.unit?.label ?? "");
  const [relatedText, setRelatedText] = useState(
    product?.relatedIds.join(", ") ?? "",
  );
  const [seoTitle, setSeoTitle] = useState(product?.seo?.title ?? "");
  const [seoDescription, setSeoDescription] = useState(
    product?.seo?.description ?? "",
  );
  const [images, setImages] = useState<ImageRef[]>(
    product?.images?.length
      ? product.images
      : [{ path: `products/${product?.id ?? "new"}/0`, alt: product?.name ?? "" }],
  );
  const [options, setOptions] = useState<OptionDraft[]>(
    product?.options?.length
      ? product.options.map((o) => ({
          name: o.name,
          valuesText: o.values.join(", "),
        }))
      : [{ name: "Madhësia", valuesText: "50 ml, 100 ml" }],
  );
  const [variants, setVariants] = useState<VariantDraft[]>(() =>
    buildVariants(
      product?.options?.length
        ? product.options.map((o) => ({
            name: o.name,
            valuesText: o.values.join(", "),
          }))
        : [{ name: "Madhësia", valuesText: "50 ml, 100 ml" }],
      product?.variants,
    ),
  );

  const optionPreview = useMemo(
    () =>
      options
        .filter((o) => o.name.trim() && o.valuesText.trim())
        .map((o) => ({
          name: o.name.trim(),
          values: o.valuesText
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
        }))
        .filter((o) => o.values.length > 0)
        .slice(0, 2),
    [options],
  );

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function rebuildMatrix() {
    setVariants(buildVariants(options, product?.variants));
  }

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const payload: SaveProductInput = {
      id: product?.id ?? null,
      name,
      slug,
      brandId: brandId || null,
      categoryIds,
      shortDescription,
      description,
      images:
        images.length > 0
          ? images
          : [
              {
                path: `products/${product?.id ?? "new"}/0`,
                alt: name || "product",
              },
            ],
      options: optionPreview,
      status,
      isNew,
      isBestSeller,
      unit:
        unitAmount && unitLabel
          ? { amount: Number(unitAmount), label: unitLabel }
          : null,
      relatedIds: relatedText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      seoTitle,
      seoDescription,
      variants: variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        optionValues: v.optionValues,
        priceCents: v.priceCents,
        compareAtCents: v.compareAtCents,
        stock: v.stock,
        isDefault: v.isDefault,
      })),
    };

    startTransition(async () => {
      const result = await saveProductAction(payload);
      if (!result.ok) {
        setError(adminCopy.productSaveFail);
        return;
      }
      setMessage(adminCopy.productSaveOk);
      if (!product && result.id) {
        router.push(`/admin/products/${result.id}`);
        router.refresh();
        return;
      }
      router.refresh();
    });
  }

  function saveStock(v: VariantDraft) {
    if (!product) return;
    setError(null);
    startTransition(async () => {
      const result = await updateStockAction({
        productId: product.id,
        variantId: v.id,
        expectedStock: v.loadedStock,
        nextStock: v.stock,
      });
      if (!result.ok) {
        setError(
          result.error === "stock_changed"
            ? adminCopy.productStockChanged
            : adminCopy.productSaveFail,
        );
        return;
      }
      setVariants((prev) =>
        prev.map((row) =>
          row.id === v.id
            ? { ...row, loadedStock: v.stock, isNew: false }
            : row,
        ),
      );
      setMessage(adminCopy.productSaveOk);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-4xl flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.productName}</span>
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            required
            className="min-h-11 border border-border bg-surface px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.productSlug}</span>
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            required
            className="min-h-11 border border-border bg-surface px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.productFilterBrand}</span>
          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="min-h-11 border border-border bg-surface px-3"
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.productFilterStatus}</span>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as SaveProductInput["status"])
            }
            className="min-h-11 border border-border bg-surface px-3"
          >
            <option value="draft">{adminCopy.productStatusDraft}</option>
            <option value="active">{adminCopy.productStatusActive}</option>
            <option value="archived">{adminCopy.productStatusArchived}</option>
          </select>
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">
          {adminCopy.productFilterCategory}
        </legend>
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={categoryIds.includes(c.id)}
                onChange={() => toggleCategory(c.id)}
              />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        <span>{adminCopy.productShort}</span>
        <input
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          className="min-h-11 border border-border bg-surface px-3"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.productDescription}</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            className="border border-border bg-surface px-3 py-2 font-mono text-sm"
          />
        </label>
        <div className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.productPreview}</span>
          <div className="prose prose-sm max-w-none border border-border bg-surface p-3 text-ink">
            <ReactMarkdown skipHtml>{description || "—"}</ReactMarkdown>
          </div>
        </div>
      </div>

      <fieldset className="flex flex-col gap-3 border border-border p-4">
        <legend className="px-1 text-sm font-medium">
          {adminCopy.productOptions}
        </legend>
        {options.map((opt, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-2">
            <input
              value={opt.name}
              onChange={(e) => {
                const next = [...options];
                next[i] = { ...opt, name: e.target.value };
                setOptions(next);
              }}
              placeholder={adminCopy.productOptionName}
              className="min-h-11 border border-border bg-surface px-3 text-sm"
            />
            <input
              value={opt.valuesText}
              onChange={(e) => {
                const next = [...options];
                next[i] = { ...opt, valuesText: e.target.value };
                setOptions(next);
              }}
              placeholder={adminCopy.productOptionValues}
              className="min-h-11 border border-border bg-surface px-3 text-sm"
            />
          </div>
        ))}
        {options.length < 2 ? (
          <button
            type="button"
            onClick={() =>
              setOptions([...options, { name: "", valuesText: "" }])
            }
            className="self-start text-sm text-ink-muted underline"
          >
            {adminCopy.productAddOption}
          </button>
        ) : null}
        <button
          type="button"
          onClick={rebuildMatrix}
          className="self-start min-h-11 border border-border px-4 text-sm"
        >
          {adminCopy.productVariants}
        </button>
      </fieldset>

      <div className="overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="p-2">{adminCopy.productSku}</th>
              <th className="p-2">Opsionet</th>
              <th className="p-2">{adminCopy.productPrice}</th>
              <th className="p-2">{adminCopy.productCompareAt}</th>
              <th className="p-2">{adminCopy.productStock}</th>
              <th className="p-2">{adminCopy.productDefault}</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {variants.map((v, i) => (
              <tr key={v.id} className="border-b border-border">
                <td className="p-2">
                  <input
                    value={v.sku}
                    onChange={(e) => {
                      const next = [...variants];
                      next[i] = { ...v, sku: e.target.value };
                      setVariants(next);
                    }}
                    className="min-h-10 w-28 border border-border px-2"
                  />
                </td>
                <td className="p-2 text-ink-muted">
                  {Object.values(v.optionValues).join(" / ") || "—"}
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    min={0}
                    value={v.priceCents}
                    onChange={(e) => {
                      const next = [...variants];
                      next[i] = {
                        ...v,
                        priceCents: Number(e.target.value) || 0,
                      };
                      setVariants(next);
                    }}
                    className="min-h-10 w-24 border border-border px-2"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    min={0}
                    value={v.compareAtCents ?? ""}
                    onChange={(e) => {
                      const next = [...variants];
                      const raw = e.target.value;
                      next[i] = {
                        ...v,
                        compareAtCents: raw === "" ? null : Number(raw) || 0,
                      };
                      setVariants(next);
                    }}
                    className="min-h-10 w-24 border border-border px-2"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    min={0}
                    value={v.stock}
                    onChange={(e) => {
                      const next = [...variants];
                      next[i] = { ...v, stock: Number(e.target.value) || 0 };
                      setVariants(next);
                    }}
                    className="min-h-10 w-20 border border-border px-2"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="radio"
                    name="defaultVariant"
                    checked={v.isDefault}
                    onChange={() =>
                      setVariants(
                        variants.map((row, j) => ({
                          ...row,
                          isDefault: j === i,
                        })),
                      )
                    }
                  />
                </td>
                <td className="p-2">
                  {product && !v.isNew ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => saveStock(v)}
                      className="text-xs underline disabled:opacity-50"
                    >
                      {adminCopy.productStockSave}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <fieldset className="flex flex-wrap gap-4 text-sm">
        <legend className="w-full font-medium">{adminCopy.productFlags}</legend>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isNew}
            onChange={(e) => setIsNew(e.target.checked)}
          />
          {adminCopy.productIsNew}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isBestSeller}
            onChange={(e) => setIsBestSeller(e.target.checked)}
          />
          {adminCopy.productIsBestSeller}
        </label>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.productUnitAmount}</span>
          <input
            value={unitAmount}
            onChange={(e) => setUnitAmount(e.target.value)}
            className="min-h-11 border border-border bg-surface px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.productUnitLabel}</span>
          <input
            value={unitLabel}
            onChange={(e) => setUnitLabel(e.target.value)}
            className="min-h-11 border border-border bg-surface px-3"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span>{adminCopy.productRelated}</span>
        <input
          value={relatedText}
          onChange={(e) => setRelatedText(e.target.value)}
          className="min-h-11 border border-border bg-surface px-3"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.productSeoTitle}</span>
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="min-h-11 border border-border bg-surface px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.productSeoDescription}</span>
          <input
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            className="min-h-11 border border-border bg-surface px-3"
          />
        </label>
      </div>

      <ProductImageEditor
        productId={product?.id ?? null}
        images={images}
        onChange={setImages}
      />
      <p className="text-xs text-ink-muted">{adminCopy.productImagesHint}</p>

      {message ? <p className="text-sm text-ink">{message}</p> : null}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || categoryIds.length === 0}
        className={cn(
          "inline-flex min-h-11 items-center justify-center bg-ink px-5 text-sm font-medium text-on-accent disabled:opacity-50",
        )}
      >
        {pending ? adminCopy.productSaving : adminCopy.productSave}
      </button>
    </form>
  );
}

"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { adminCopy } from "@/content/admin";
import type { ImageRef } from "@/lib/shop/schemas";
import { MAX_IMAGE_BYTES } from "@/lib/images/widths";
import { uploadProductImageAction } from "@/app/admin/products/actions";
import { cn } from "cn";

type ProductImageEditorProps = {
  productId: string | null;
  images: ImageRef[];
  onChange: (images: ImageRef[]) => void;
};

export function ProductImageEditor({
  productId,
  images,
  onChange,
}: ProductImageEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [altDraft, setAltDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function updateAlt(index: number, alt: string) {
    onChange(images.map((img, i) => (i === index ? { ...img, alt } : img)));
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function reorder(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= images.length || to >= images.length) {
      return;
    }
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
  }

  function uploadFile(file: File) {
    setError(null);
    if (!productId) {
      setError(adminCopy.productImagesSaveFirst);
      return;
    }
    if (!altDraft.trim()) {
      setError(adminCopy.productImagesAltRequired);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(adminCopy.productImagesTooLarge);
      return;
    }

    const formData = new FormData();
    formData.set("productId", productId);
    formData.set("alt", altDraft.trim());
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadProductImageAction(formData);
      if (!result.ok) {
        setError(
          result.error === "image_too_large"
            ? adminCopy.productImagesTooLarge
            : adminCopy.productImagesUploadFail,
        );
        return;
      }
      onChange([...images, result.image]);
      setAltDraft("");
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">{adminCopy.productImages}</p>

      <ul className="flex flex-col gap-3">
        {images.map((img, i) => (
          <li
            key={`${img.path}-${i}`}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null) reorder(dragIndex, i);
              setDragIndex(null);
            }}
            className={cn(
              "flex items-center gap-3 border border-border bg-surface p-2",
              dragIndex === i && "opacity-60",
            )}
          >
            <div className="relative size-16 shrink-0 overflow-hidden bg-surface-2">
              <Image
                src={img.path}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
              <span>{adminCopy.productImagesAlt}</span>
              <input
                value={img.alt}
                onChange={(e) => updateAlt(i, e.target.value)}
                required
                className="min-h-10 border border-border px-2"
              />
            </label>
            <span className="cursor-grab text-xs text-ink-muted" title="Reorder">
              ↕
            </span>
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="text-sm text-ink-muted underline"
            >
              {adminCopy.productImagesRemove}
            </button>
          </li>
        ))}
      </ul>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center gap-3 border border-dashed border-border px-4 py-8 text-center",
          dragOver && "bg-surface-2",
        )}
      >
        <p className="text-sm text-ink-muted">{adminCopy.productImagesDrop}</p>
        <label className="flex w-full max-w-sm flex-col gap-1 text-left text-sm">
          <span>{adminCopy.productImagesAlt}</span>
          <input
            value={altDraft}
            onChange={(e) => setAltDraft(e.target.value)}
            className="min-h-10 border border-border bg-surface px-2"
            placeholder={adminCopy.productImagesAlt}
          />
        </label>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={pending || !productId}
          onClick={() => inputRef.current?.click()}
          className="min-h-11 bg-ink px-4 text-sm text-on-accent disabled:opacity-50"
        >
          {pending
            ? adminCopy.productImagesUploading
            : adminCopy.productImagesPick}
        </button>
        {!productId ? (
          <p className="text-xs text-ink-muted">{adminCopy.productImagesSaveFirst}</p>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

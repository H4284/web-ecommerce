"use client";

import Image from "next/image";
import { useState } from "react";
import type { ImageRef } from "@/lib/shop/schemas";
import { cn } from "cn";

type ProductGalleryProps = {
  images: ImageRef[];
  activePath?: string | null;
  productName: string;
};

export function ProductGallery({ images, activePath, productName }: ProductGalleryProps) {
  const list =
    activePath && !images.some((img) => img.path === activePath)
      ? [{ path: activePath, alt: productName }, ...images]
      : images;

  const preferredIndex = activePath
    ? Math.max(
        0,
        list.findIndex((img) => img.path === activePath),
      )
    : 0;

  return (
    <GalleryInner
      key={`${activePath ?? "none"}:${list.map((i) => i.path).join("|")}`}
      list={list}
      initialIndex={preferredIndex}
      productName={productName}
    />
  );
}

function GalleryInner({
  list,
  initialIndex,
  productName,
}: {
  list: ImageRef[];
  initialIndex: number;
  productName: string;
}) {
  const [index, setIndex] = useState(initialIndex);

  if (list.length === 0) {
    return <div className="aspect-[4/5] w-full bg-surface-2" aria-hidden />;
  }

  const current = list[index] ?? list[0]!;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
        <Image
          key={current.path}
          src={current.path}
          alt={current.alt || productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {list.length > 1 ? (
        <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
          {list.map((image, i) => (
            <li key={image.path} className="shrink-0 snap-start">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Foto ${i + 1}`}
                aria-pressed={i === index}
                className={cn(
                  "relative block size-16 overflow-hidden bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:size-20",
                  i === index ? "ring-2 ring-ink" : "ring-1 ring-border",
                )}
              >
                <Image
                  src={image.path}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {list.length > 1 ? (
        <div className="flex gap-2 md:hidden">
          {list.map((_, i) => (
            <button
              key={`dot-${i}`}
              type="button"
              aria-label={`Shko te foto ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2 flex-1 rounded-sm",
                i === index ? "bg-ink" : "bg-border",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

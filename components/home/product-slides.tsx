"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { ProductDoc } from "@/lib/shop/catalog-queries";
import { formatCents } from "@/lib/shop/money";
import { homeProducts } from "@/content/home";
import { shopCopy } from "@/content/shop";
import { cn } from "cn";

export type ProductSlideModel = {
  product: ProductDoc;
  blurb: string;
};

type ProductSlidesProps = {
  slides: ProductSlideModel[];
};

export function ProductSlides({ slides }: ProductSlidesProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = slides.length;

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || count === 0) return;
    const i = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1));
    setIndex(Math.min(count - 1, Math.max(0, i)));
  }, [count]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  if (count === 0) return null;

  const counter = `${String(index + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;

  return (
    <section
      className="bg-surface-2"
      role="region"
      aria-roledescription="carousel"
      aria-label="Produkte"
    >
      <div className="relative hidden lg:block">
        <div className="sticky top-[var(--site-top-offset)] h-[calc(100dvh-var(--site-top-offset))] overflow-hidden">
          <p
            className="pointer-events-none absolute top-[var(--space-5)] right-[var(--space-6)] z-20 text-sm text-ink"
            aria-live="polite"
          >
            {counter}
          </p>
          <div
            ref={trackRef}
            className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
          >
            {slides.map((slide) => (
              <SlidePanel key={slide.product.id} slide={slide} layout="desktop" />
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-h-[var(--product-slides-mobile-min)] flex-col lg:hidden">
        {slides.map((slide, i) => (
          <SlidePanel
            key={slide.product.id}
            slide={slide}
            layout="mobile"
            counter={`${String(i + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`}
          />
        ))}
      </div>
    </section>
  );
}

function SlidePanel({
  slide,
  layout,
  counter,
}: {
  slide: ProductSlideModel;
  layout: "desktop" | "mobile";
  counter?: string;
}) {
  const { product, blurb } = slide;
  const from = product.minPriceCents !== product.maxPriceCents;
  const image = product.images[0];
  const isMobile = layout === "mobile";

  return (
    <article
      className={cn(
        "relative",
        isMobile
          ? "flex min-h-[var(--product-slide-mobile-height)] flex-col gap-[var(--space-5)] border-b border-border px-4 py-[var(--space-8)]"
          : "flex h-full w-full shrink-0 snap-start basis-full",
      )}
    >
      {isMobile && counter ? (
        <p className="absolute top-4 right-4 text-xs text-ink-muted" aria-hidden>
          {counter}
        </p>
      ) : null}

      <div
        className={cn(
          "flex flex-col gap-[var(--space-4)]",
          isMobile
            ? "max-w-[18rem] justify-start"
            : "h-full justify-center px-[var(--space-6)]",
        )}
        style={
          isMobile
            ? undefined
            : {
                width: "var(--product-slide-text)",
                maxWidth: "var(--product-slide-text-max)",
              }
        }
      >
        <p className="text-xs tracking-wide text-ink-muted uppercase">{homeProducts.eyebrow}</p>
        <h3
          className={cn(
            "font-display tracking-display text-ink text-balance",
            isMobile ? "text-2xl" : "text-3xl",
          )}
        >
          {product.name}
        </h3>
        <p className={cn("text-ink", isMobile ? "text-base" : "text-lg")}>
          {from ? <span className="text-ink-muted">{shopCopy.fromPrice} </span> : null}
          {formatCents(product.minPriceCents)}
        </p>
        <Link
          href={`/products/${product.slug}`}
          className={cn(
            "inline-flex w-fit min-h-11 items-center gap-2 text-sm tracking-wide uppercase underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            isMobile ? "text-accent" : "text-ink",
          )}
        >
          {homeProducts.ctaLabel}
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
        <p className="max-w-prose text-sm leading-relaxed text-ink-muted">{blurb}</p>
      </div>

      <div
        className={cn(
          "relative flex items-center justify-center",
          isMobile ? "mx-auto w-full max-w-sm py-6" : "h-full flex-1",
        )}
        style={isMobile ? undefined : { width: "var(--product-slide-media)" }}
      >
        <div
          className={cn(
            "absolute bg-accent-soft",
            isMobile
              ? "inset-y-0 left-1/2 w-[40%] -translate-x-1/2"
              : "top-0 bottom-0 left-1/2 w-[var(--product-overlay-width)] -translate-x-1/2",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "relative z-10 aspect-[533/765]",
            isMobile ? "w-[70%]" : "w-[min(100%,var(--product-cutout-width))]",
          )}
        >
          {image ? (
            <Image
              src={image.path}
              alt={image.alt}
              fill
              loading="lazy"
              sizes={isMobile ? "70vw" : "(max-width: 1440px) 40vw, 533px"}
              className="object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface text-sm text-ink-muted">
              {homeProducts.cutoutPendingAlt}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

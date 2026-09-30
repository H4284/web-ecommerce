"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { ArrowUpRight } from "lucide-react";
import type { HeroSlide } from "@/lib/shop/hero-slides";
import { homeHero } from "@/content/home";
import { cn } from "cn";

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

type HeroSlideshowProps = {
  slides: HeroSlide[];
};

export function HeroSlideshow({ slides }: HeroSlideshowProps) {
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const [index, setIndex] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const count = slides.length;
  const slide = slides[index] ?? slides[0];

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      const target = ((next % count) + count) % count;
      if (target === index) return;
      setOutgoing(index);
      setIndex(target);
    },
    [count, index],
  );

  useEffect(() => {
    if (outgoing == null) return;
    // Keep outgoing slide mounted for the crossfade (`--duration-slow` = 700ms).
    const ms = reduceMotion ? 0 : 700;
    const id = window.setTimeout(() => setOutgoing(null), ms);
    return () => window.clearTimeout(id);
  }, [outgoing, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || count < 2) return;
    const id = window.setInterval(() => go(index + 1), 6000);
    return () => window.clearInterval(id);
  }, [count, go, index, reduceMotion]);

  if (!slide) return null;

  const counter = `${String(index + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;
  const visible = new Set(
    [index, outgoing].filter((n): n is number => n != null && n >= 0),
  );

  return (
    <section
      className="relative h-[calc(100dvh-var(--site-top-offset))] min-h-[calc(100dvh-var(--site-top-offset))] w-full overflow-hidden bg-ink"
      aria-roledescription="carousel"
      aria-label="Hero"
    >
      {slides.map((item, i) => {
        if (!visible.has(i)) return null;
        return (
          <div
            key={item.id}
            className={cn(
              "absolute inset-0 transition-opacity ease-[var(--ease-in-out)] duration-[var(--duration-slow)]",
              i === index ? "z-10 opacity-100" : "z-0 opacity-0",
              reduceMotion && "transition-none",
            )}
            aria-hidden={i !== index}
          >
            <div className="hidden h-full lg:grid lg:grid-cols-2">
              <div className="relative h-full overflow-hidden bg-surface-2">
                <ProductHalf slide={item} priority={i === index} />
              </div>
              <div className="relative h-full overflow-hidden bg-ink">
                <AtmosphereHalf />
                <p className="pointer-events-none absolute top-1/2 right-[12%] z-10 max-w-[10ch] -translate-y-1/2 text-right font-display text-4xl tracking-display text-on-accent">
                  {item.rightLabel}
                </p>
              </div>
            </div>
            <div className="relative h-full lg:hidden">
              <ProductHalf slide={item} priority={i === index} />
            </div>
          </div>
        );
      })}

      <div className="pointer-events-none absolute inset-0 z-20 hidden items-center justify-center lg:flex">
        <Link
          href={slide.href}
          className="pointer-events-auto inline-flex min-h-11 items-center gap-2 px-2 font-body text-sm tracking-wide text-on-accent uppercase underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-accent"
        >
          {homeHero.ctaLabel}
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-3 p-4 lg:hidden">
        <div className="flex items-center justify-end gap-2 text-xs text-on-accent">
          <span aria-live="polite">{counter}</span>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="inline-flex size-11 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-accent"
            aria-label="Slide tjetër"
          >
            <ArrowUpRight className="size-4 rotate-45" aria-hidden />
          </button>
        </div>
        <Link
          href={slide.href}
          className="flex min-h-14 items-center justify-between gap-3 bg-ink/70 px-4 py-3 text-on-accent backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-accent"
        >
          <span className="font-display text-lg tracking-display">{slide.name}</span>
          <span className="inline-flex items-center gap-1 text-xs tracking-wide uppercase">
            {homeHero.ctaLabel}
            <ArrowUpRight className="size-3.5" aria-hidden />
          </span>
        </Link>
      </div>
    </section>
  );
}

function ProductHalf({
  slide,
  priority = false,
}: {
  slide: HeroSlide;
  priority?: boolean;
}) {
  if (slide.productImage) {
    return (
      <Image
        src={slide.productImage.path}
        alt={slide.productImage.alt}
        fill
        priority={priority}
        fetchPriority={priority ? "high" : "auto"}
        // Cap device-pixel requests at 640px width (IMAGE_WIDTHS) so LCP is not a 1280 file.
        sizes="(max-width: 1024px) 200px, 280px"
        className="object-cover"
      />
    );
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-2 px-6 text-center">
      <p className="font-display text-2xl tracking-display text-ink md:text-3xl">{slide.name}</p>
      <p className="text-sm text-ink-muted">{homeHero.productPendingAlt}</p>
    </div>
  );
}

function AtmosphereHalf() {
  return (
    <div
      className="absolute inset-0 bg-gradient-to-br from-ink via-ink to-accent"
      role="img"
      aria-label={homeHero.atmospherePendingAlt}
    />
  );
}

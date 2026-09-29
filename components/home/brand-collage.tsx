"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowUpRight } from "lucide-react";
import { homeBrand } from "@/content/home";
import { site } from "@/content/site";
import { cn } from "cn";

export type BrandCollageTile = {
  path?: string;
  alt: string;
};

type BrandCollageProps = {
  tiles?: BrandCollageTile[];
};

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

const DRIFT: Record<string, string> = {
  a: "collage-drift-a",
  b: "collage-drift-b",
  c: "collage-drift-c",
};

export function BrandCollage({ tiles = [] }: BrandCollageProps) {
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  return (
    <section
      className="relative min-h-[var(--band-collage-height-mobile)] overflow-hidden bg-surface-2 md:min-h-[var(--band-collage-height)]"
      aria-labelledby="brand-collage-title"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {homeBrand.tiles.map((slot, i) => {
          const media = tiles[i];
          return (
            <div
              key={`${slot.left}-${slot.top}-${i}`}
              className={cn(
                "absolute w-[var(--collage-tile-width)] overflow-hidden bg-surface shadow-sm",
                !reduceMotion && DRIFT[slot.drift],
              )}
              style={{
                left: slot.left,
                top: slot.top,
                aspectRatio: slot.aspect,
              }}
            >
              {media?.path ? (
                <Image
                  src={media.path}
                  alt={media.alt}
                  fill
                  sizes="144px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-accent-soft px-2 text-center">
                  <span className="text-xs text-ink-muted">{homeBrand.tilePendingAlt}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-6xl flex-col items-center justify-start gap-[var(--space-8)] px-4 pt-[18%] pb-[var(--space-16)]">
        <h2
          id="brand-collage-title"
          className="w-full max-w-[28rem] text-center font-display text-4xl tracking-display text-ink md:text-5xl"
        >
          {homeBrand.title || site.name}
        </h2>
        <Link
          href={homeBrand.ctaHref}
          className="inline-flex min-h-11 items-center gap-2 border border-ink px-5 text-sm tracking-wide text-ink uppercase transition-colors hover:bg-ink hover:text-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {homeBrand.ctaLabel}
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

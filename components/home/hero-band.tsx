import type { HeroSlide } from "@/lib/shop/hero-slides";
import { heroLcpUrl } from "@/lib/shop/hero-lcp";
import { HeroSlideshow } from "@/components/home/hero-slideshow";

type HeroBandProps = {
  slides: HeroSlide[];
};

/**
 * Server LCP frame: a native `<img>` in the initial HTML, then the client carousel on top.
 * Avoids waiting on the hero client bundle before the largest paint.
 */
export function HeroBand({ slides }: HeroBandProps) {
  const first = slides[0];
  const image = first?.productImage;
  const lcpHref = image ? heroLcpUrl(image.path, 640) : null;

  return (
    <section
      className="relative h-[calc(100dvh-var(--site-top-offset))] min-h-[calc(100dvh-var(--site-top-offset))] w-full overflow-hidden bg-ink"
      aria-label="Hero"
    >
      {lcpHref && image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- LCP must be a plain img in the server HTML */}
          <img
            src={lcpHref}
            alt={image.alt}
            width={640}
            height={800}
            fetchPriority="high"
            decoding="sync"
            className="absolute inset-0 z-[1] h-full w-full object-cover lg:w-1/2"
          />
        </>
      ) : null}
      <HeroSlideshow slides={slides} serverLcpId={first?.id ?? null} />
    </section>
  );
}

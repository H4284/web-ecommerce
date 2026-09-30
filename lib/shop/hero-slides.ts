import type { ProductDoc } from "@/lib/shop/catalog-queries";
import type { HomeHeroSlide } from "@/lib/shop/home-content-schema";
import { homeHero } from "@/content/home";

export type HeroSlide = {
  id: string;
  name: string;
  rightLabel: string;
  href: string;
  productImage: { path: string; alt: string } | null;
};

export function buildHeroSlidesFromContent(
  slides: HomeHeroSlide[],
): HeroSlide[] {
  return [...slides]
    .filter((s) => s.active)
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      id: s.id,
      name: s.title,
      rightLabel: s.subtitle || s.title,
      href: s.link,
      productImage: s.imagePath
        ? { path: s.imagePath, alt: s.title }
        : null,
    }));
}

export function buildHeroSlides(products: ProductDoc[]): HeroSlide[] {
  if (products.length === 0) {
    return homeHero.fallbackSlides.map((slide) => ({
      id: slide.slug,
      name: slide.name,
      rightLabel: slide.rightLabel,
      href: slide.href,
      productImage: null,
    }));
  }

  return products.slice(0, 3).map((product) => {
    const primary = product.images[0] ?? null;
    return {
      id: product.id,
      name: product.name,
      rightLabel: homeHero.rightLabels[product.slug] ?? product.name,
      href: `/products/${product.slug}`,
      productImage: primary,
    };
  });
}

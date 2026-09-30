import { homeContentSchema, type HomeContent } from "@/lib/shop/home-content-schema";
import { homeHero } from "@/content/home";

/** Default Firestore doc when seed / first admin open has no content/home yet. */
export function buildSeedHomeContent(): HomeContent {
  return homeContentSchema.parse({
    heroSlides: homeHero.fallbackSlides.map((slide, i) => ({
      id: slide.slug,
      imagePath: null,
      title: slide.name,
      subtitle: slide.rightLabel,
      link: slide.href,
      order: i,
      active: true,
    })),
    promoBlocks: [],
    brandStripProductIds: [],
  });
}

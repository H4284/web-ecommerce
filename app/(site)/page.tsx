import { getBestSellers, getNewProducts, listProducts } from "@/lib/shop/catalog";
import type { ProductDoc } from "@/lib/shop/catalog-queries";
import { getHomeContent } from "@/lib/shop/home-content";
import {
  buildHeroSlides,
  buildHeroSlidesFromContent,
} from "@/lib/shop/hero-slides";
import { homeBrand } from "@/content/home";
import { BrandCollage } from "@/components/home/brand-collage";
import { HeroSlideshow } from "@/components/home/hero-slideshow";
import { HomePromos } from "@/components/home/home-promos";
import { ProductSlides } from "@/components/home/product-slides";
import { StoryManifesto } from "@/components/home/story-manifesto";
import { TrustAccordion } from "@/components/home/trust-accordion";

export default async function HomePage() {
  let products: ProductDoc[] = [];
  let featureProducts: ProductDoc[] = [];
  let catalogPool: ProductDoc[] = [];
  try {
    const [fresh, best, listed] = await Promise.all([
      getNewProducts(12),
      getBestSellers(3),
      listProducts({ page: 1, pageSize: 48, sort: "newest" }),
    ]);
    products = fresh;
    featureProducts = best.length >= 3 ? best.slice(0, 3) : fresh.slice(0, 3);
    catalogPool = listed.items;
  } catch (err) {
    console.error("[home] catalog unavailable:", err);
  }

  let homeContent = null;
  try {
    homeContent = await getHomeContent();
  } catch (err) {
    console.error("[home] content unavailable:", err);
  }

  const cmsSlides = homeContent
    ? buildHeroSlidesFromContent(homeContent.heroSlides)
    : [];
  const slides =
    cmsSlides.length > 0 ? cmsSlides : buildHeroSlides(products.slice(0, 3));

  const collageSources = orderByIds(
    homeContent?.brandStripProductIds ?? [],
    catalogPool.length > 0 ? catalogPool : products,
  );
  const collageTiles = homeBrand.tiles.map((_, i) => {
    const product = collageSources[i];
    const image = product?.images[0];
    return {
      path: image?.path,
      alt: image?.alt ?? homeBrand.tilePendingAlt,
    };
  });
  const productSlides = featureProducts.map((product) => ({
    product,
    blurb: product.shortDescription,
  }));

  const promos = (homeContent?.promoBlocks ?? [])
    .filter((p) => p.active)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      <HeroSlideshow slides={slides} />
      <BrandCollage tiles={collageTiles} />
      <HomePromos blocks={promos} />
      <StoryManifesto />
      <ProductSlides slides={productSlides} />
      <TrustAccordion />
    </>
  );
}

function orderByIds(ids: string[], pool: ProductDoc[]): ProductDoc[] {
  if (ids.length === 0) return pool;
  const map = new Map(pool.map((p) => [p.id, p]));
  const ordered: ProductDoc[] = [];
  for (const id of ids) {
    const p = map.get(id);
    if (p) ordered.push(p);
  }
  return ordered.length > 0 ? ordered : pool;
}

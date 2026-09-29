import { getBestSellers, getNewProducts } from "@/lib/shop/catalog";
import type { ProductDoc } from "@/lib/shop/catalog-queries";
import { buildHeroSlides } from "@/lib/shop/hero-slides";
import { homeBrand } from "@/content/home";
import { BrandCollage } from "@/components/home/brand-collage";
import { HeroSlideshow } from "@/components/home/hero-slideshow";
import { ProductSlides } from "@/components/home/product-slides";
import { StoryManifesto } from "@/components/home/story-manifesto";
import { TrustAccordion } from "@/components/home/trust-accordion";

export default async function HomePage() {
  let products: ProductDoc[] = [];
  let featureProducts: ProductDoc[] = [];
  try {
    const [fresh, best] = await Promise.all([getNewProducts(12), getBestSellers(3)]);
    products = fresh;
    featureProducts = best.length >= 3 ? best.slice(0, 3) : fresh.slice(0, 3);
  } catch (err) {
    console.error("[home] catalog unavailable:", err);
  }

  const slides = buildHeroSlides(products.slice(0, 3));
  const collageTiles = homeBrand.tiles.map((_, i) => {
    const product = products[i];
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

  return (
    <>
      <HeroSlideshow slides={slides} />
      <BrandCollage tiles={collageTiles} />
      <StoryManifesto />
      <ProductSlides slides={productSlides} />
      <TrustAccordion />
    </>
  );
}

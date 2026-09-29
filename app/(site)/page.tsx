import { getNewProducts } from "@/lib/shop/catalog";
import { buildHeroSlides } from "@/lib/shop/hero-slides";
import { homeBrand } from "@/content/home";
import { BrandCollage } from "@/components/home/brand-collage";
import { HeroSlideshow } from "@/components/home/hero-slideshow";
import { StoryManifesto } from "@/components/home/story-manifesto";

export default async function HomePage() {
  let products: Awaited<ReturnType<typeof getNewProducts>> = [];
  try {
    products = await getNewProducts(12);
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

  return (
    <>
      <HeroSlideshow slides={slides} />
      <BrandCollage tiles={collageTiles} />
      <StoryManifesto />
    </>
  );
}

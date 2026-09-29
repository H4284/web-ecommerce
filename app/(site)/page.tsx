import { getNewProducts } from "@/lib/shop/catalog";
import { buildHeroSlides } from "@/lib/shop/hero-slides";
import { HeroSlideshow } from "@/components/home/hero-slideshow";

export default async function HomePage() {
  let products: Awaited<ReturnType<typeof getNewProducts>> = [];
  try {
    products = await getNewProducts(3);
  } catch (err) {
    console.error("[home] hero products unavailable:", err);
  }

  const slides = buildHeroSlides(products);

  return (
    <>
      <HeroSlideshow slides={slides} />
    </>
  );
}

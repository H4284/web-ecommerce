import type { Metadata } from "next";
import { getNewProducts } from "@/lib/shop/catalog";
import type { ProductDoc } from "@/lib/shop/catalog-queries";
import { getHomeContent } from "@/lib/shop/home-content";
import {
  buildHeroSlides,
  buildHeroSlidesFromContent,
} from "@/lib/shop/hero-slides";
import { organizationJsonLd, websiteJsonLd } from "@/lib/shop/json-ld";
import { getShopSettings } from "@/lib/shop/settings";
import { absoluteUrl, siteUrl } from "@/lib/shop/site-url";
import { homeBrand } from "@/content/home";
import { site } from "@/content/site";
import { BrandCollage } from "@/components/home/brand-collage";
import { HeroSlideshow } from "@/components/home/hero-slideshow";
import { HomePromos } from "@/components/home/home-promos";
import { ProductSlides } from "@/components/home/product-slides";
import { StoryManifesto } from "@/components/home/story-manifesto";
import { TrustAccordion } from "@/components/home/trust-accordion";

export const metadata: Metadata = {
  title: { absolute: `${site.name} · ${site.tagline}` },
  description: site.tagline,
  alternates: { canonical: absoluteUrl("/") },
};

export default async function HomePage() {
  let products: ProductDoc[] = [];
  let featureProducts: ProductDoc[] = [];
  let catalogPool: ProductDoc[] = [];
  let homeContent = null;
  let company: {
    email: string | null;
    phone: string | null;
    address: string | null;
  } = {
    email: site.email,
    phone: site.whatsapp,
    address: site.nap.address.includes("CONFIRM") ? null : site.nap.address,
  };

  try {
    // One catalog read for hero + collage + feature slides — fewer emulator round-trips for LCP.
    const [fresh, content, settings] = await Promise.all([
      getNewProducts(12),
      getHomeContent().catch((err) => {
        console.error("[home] content unavailable:", err);
        return null;
      }),
      getShopSettings().catch(() => null),
    ]);
    products = fresh;
    featureProducts = fresh.slice(0, 3);
    catalogPool = fresh;
    homeContent = content;
    if (settings) {
      company = {
        email: settings.company.email,
        phone: settings.company.phone,
        address: settings.company.address,
      };
    }
  } catch (err) {
    console.error("[home] catalog unavailable:", err);
  }

  const cmsSlides = homeContent
    ? buildHeroSlidesFromContent(homeContent.heroSlides)
    : [];
  const productHero = buildHeroSlides(products.slice(0, 3));
  // Seeded CMS slides often lack imagePath — fill from catalog so the LCP frame is a real image.
  const slides =
    cmsSlides.length > 0
      ? cmsSlides.map((slide, i) => ({
          ...slide,
          productImage: slide.productImage ?? productHero[i]?.productImage ?? null,
          href:
            slide.href && slide.href !== "#"
              ? slide.href
              : (productHero[i]?.href ?? slide.href),
        }))
      : productHero;

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

  const base = siteUrl();
  const orgLd = organizationJsonLd({
    name: site.name,
    url: absoluteUrl("/"),
    email: company.email,
    telephone: company.phone,
    address: company.address,
  });
  const siteLd = websiteJsonLd({
    name: site.name,
    url: absoluteUrl("/"),
    searchUrlTemplate: `${base}/search?q={search_term_string}`,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }}
      />
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

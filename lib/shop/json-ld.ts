type BreadcrumbLdItem = {
  name: string;
  path: string;
};

export function breadcrumbJsonLd(items: BreadcrumbLdItem[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl.replace(/\/$/, "")}${item.path}`,
    })),
  };
}

type ProductOfferInput = {
  sku: string;
  priceCents: number;
  stock: number;
  url: string;
};

type ProductLdInput = {
  name: string;
  description: string;
  imageUrls: string[];
  brandName?: string | null;
  offers: ProductOfferInput[];
};

export function productJsonLd(product: ProductLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.imageUrls,
    ...(product.brandName
      ? { brand: { "@type": "Brand", name: product.brandName } }
      : {}),
    offers: product.offers.map((offer) => ({
      "@type": "Offer",
      sku: offer.sku,
      price: (offer.priceCents / 100).toFixed(2),
      priceCurrency: "EUR",
      availability:
        offer.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: offer.url,
    })),
  };
}

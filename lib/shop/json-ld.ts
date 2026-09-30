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

type OrganizationLdInput = {
  name: string;
  url: string;
  logoUrl?: string;
  email?: string | null;
  telephone?: string | null;
  address?: string | null;
};

export function organizationJsonLd(org: OrganizationLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.name,
    url: org.url,
    ...(org.logoUrl ? { logo: org.logoUrl } : {}),
    ...(org.email ? { email: org.email } : {}),
    ...(org.telephone ? { telephone: org.telephone } : {}),
    ...(org.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: org.address,
          },
        }
      : {}),
  };
}

type WebsiteLdInput = {
  name: string;
  url: string;
  searchUrlTemplate: string;
};

export function websiteJsonLd(site: WebsiteLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: site.searchUrlTemplate,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

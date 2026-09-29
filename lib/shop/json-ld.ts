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

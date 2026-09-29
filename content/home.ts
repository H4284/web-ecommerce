/** Home band copy. Photos stay labelled placeholders until the client delivers. */

export const homeHero = {
  /** Blueprint CTA; Albanian default locale. */
  ctaLabel: "Eksploro",
  /** Mid-height labels on the right half (desktop), keyed by product slug. */
  rightLabels: {
    qelibar: "I ngrohtë",
    vese: "I qetë",
    kreatine: "I thellë",
  } as Record<string, string>,
  fallbackSlides: [
    {
      slug: "qelibar",
      name: "Qelibar",
      rightLabel: "I ngrohtë",
      href: "/products/qelibar",
    },
    {
      slug: "vese",
      name: "Vesë",
      rightLabel: "I qetë",
      href: "/products/vese",
    },
    {
      slug: "kreatine",
      name: "Kreatinë",
      rightLabel: "I thellë",
      href: "/products/kreatine",
    },
  ],
  atmospherePendingAlt: "Foto e atmosferës — në pritje",
  productPendingAlt: "Foto e produktit — në pritje",
} as const;

export const homeBrand = {
  title: "Sanem",
  ctaLabel: "Zbulo linjën",
  ctaHref: "/koleksioni",
  tilePendingAlt: "Foto e koleksionit — në pritje",
  /**
   * Absolute tile placements as % of the collage band (from Nymphai live measure).
   * Width ~144px; heights vary (mixed aspect).
   */
  tiles: [
    { left: "-3%", top: "10%", aspect: "1.13", drift: "a" },
    { left: "20%", top: "3%", aspect: "1.79", drift: "b" },
    { left: "27%", top: "5%", aspect: "0.92", drift: "c" },
    { left: "73%", top: "12%", aspect: "1.79", drift: "a" },
    { left: "81%", top: "3%", aspect: "1.34", drift: "b" },
    { left: "10%", top: "33%", aspect: "1.79", drift: "c" },
    { left: "23%", top: "27%", aspect: "0.8", drift: "a" },
    { left: "45%", top: "30%", aspect: "0.77", drift: "b" },
    { left: "76%", top: "32%", aspect: "1.34", drift: "c" },
    { left: "84%", top: "25%", aspect: "0.71", drift: "a" },
    { left: "58%", top: "8%", aspect: "1.1", drift: "b" },
  ],
} as const;

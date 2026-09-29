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

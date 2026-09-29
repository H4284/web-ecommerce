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

export const homeStory = {
  decorWord: "Sanem",
  headline:
    "Sanem, kapitulli i parë; një erë që qëndron me ty dhe rifloron çdo ditë.",
  paragraphs: [
    "Sanem lind në Prishtinë si një ritual i qetë. Parfume të prodhuara me kujdes, për lëkurën dhe për momentin kur zgjidh erën që të përfaqëson.",
    "Çdo shishe mban një histori të shkurtër dhe të saktë: nota që hapen ngadalë, qëndrueshmëri e butë, dhe luks pa zhurmë — quiet luxury in a bottle.",
  ],
} as const;

export const homeProducts = {
  eyebrow: "Koleksioni",
  ctaLabel: "Eksploro",
  cutoutPendingAlt: "Shishe parfumi — në pritje",
} as const;

/** Band 5 — three trust pillars; expand one at a time. */
export const homeTrust = {
  label: "Pse Sanem",
  pillars: [
    {
      id: "prishtine",
      title: "Prodhim në Prishtinë",
      body: "Çdo erë lind këtu, me kujdes dhe me kohë. Parfume të përzgjedhura për lëkurën dhe për ritualin e përditshëm — quiet luxury, pa zhurmë.",
    },
    {
      id: "notes",
      title: "Nota që qëndrojnë",
      body: "Hapje e butë, zemër e qartë, bazë që rifloron. Formuluar që të qëndrojë me ty gjatë ditës, jo vetëm në shishe.",
    },
    {
      id: "delivery",
      title: "Blerje pa stres",
      body: "Para në dorëzim në Kosovë. Transport falas mbi 50,00 €. Paketim i qetë, gati për dhuratë ose për ty.",
    },
  ],
} as const;

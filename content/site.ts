export const site = {
  name: "Sanem",
  tagline: "Quiet luxury in a bottle",
  city: "Prishtinë",
  country: "Kosovo",
  locales: ["sq", "en"] as const,
  defaultLocale: "sq" as const,
  nap: {
    name: "Sanem",
    address: "⚠️ CONFIRM WITH CLIENT",
    hours: "⚠️ CONFIRM WITH CLIENT",
  },
  phone: null as string | null,
  whatsapp: "+38349625317",
  email: null as string | null,
  social: {} as Record<string, string>,
  /** Secondary links (categories come from Firestore). */
  nav: [
    { href: "/koleksioni", label: "Dyqani" },
    { href: "/rreth-nesh", label: "Rreth nesh" },
    { href: "/kontakt", label: "Kontaktoni" },
  ],
  footer: {
    categoriesHeading: "Kategoritë",
    helpHeading: "Ndihma",
    legalHeading: "Ligjore",
    helpLinks: [
      { href: "/dergesa", label: "Dorëzimi" },
      { href: "/kthime", label: "Kthimet" },
      { href: "/pyetje-te-shpeshta", label: "Pyetje të shpeshta" },
      { href: "/kontakt", label: "Kontaktoni" },
    ],
    legalLinks: [
      { href: "/rreth-nesh", label: "Rreth nesh" },
      { href: "/privatesia", label: "Privatësia" },
      { href: "/kushtet", label: "Kushtet" },
    ],
  },
  chrome: {
    skipToContent: "Kalo te përmbajtja",
    openMenu: "Hap menunë",
    closeMenu: "Mbyll menunë",
    search: "Kërko",
    searchShortcut: "⌘K",
    cart: "Shporta",
    freeDeliveryPrefix: "Transport falas mbi",
    notFoundTitle: "Faqja nuk u gjet",
    notFoundBody: "Kjo faqe nuk ekziston ose është zhvendosur.",
    notFoundCta: "Kthehu në kreun",
  },
  primaryCta: {
    label: "WhatsApp",
    href: "https://wa.me/38349625317",
  },
} as const;

export type SiteLocale = (typeof site.locales)[number];

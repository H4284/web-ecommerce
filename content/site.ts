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
  nav: [
    { href: "/koleksioni", label: "Koleksioni" },
    { href: "/rreth-nesh", label: "Rreth nesh" },
    { href: "/kontakt", label: "Kontakt" },
  ],
  primaryCta: {
    label: "WhatsApp",
    href: "https://wa.me/38349625317",
  },
} as const;

export type SiteLocale = (typeof site.locales)[number];

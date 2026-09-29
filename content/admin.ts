export const adminCopy = {
  title: "Admin",
  dashboard: "Paneli",
  products: "Produktet",
  categories: "Kategoritë",
  brands: "Markat",
  orders: "Porositë",
  discounts: "Zbritjet",
  content: "Përmbajtja",
  settings: "Cilësimet",
  signOut: "Dil",
  signedInAs: "I kyçur si",
  placeholder: "Kjo faqe ndërtohet në njësinë e radhës.",
  dashboardBody: "Mirë se vini në panelin e Sanem.",
} as const;

export const adminNav = [
  { href: "/admin", label: adminCopy.dashboard },
  { href: "/admin/products", label: adminCopy.products },
  { href: "/admin/categories", label: adminCopy.categories },
  { href: "/admin/brands", label: adminCopy.brands },
  { href: "/admin/orders", label: adminCopy.orders },
  { href: "/admin/discounts", label: adminCopy.discounts },
  { href: "/admin/content", label: adminCopy.content },
  { href: "/admin/settings", label: adminCopy.settings },
] as const;

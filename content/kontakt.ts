import { site } from "@/content/site";

/** Contact page — WhatsApp only (plan Conversion: Form off). */
export const kontakt = {
  title: "Kontaktoni",
  description: `Na shkruani në WhatsApp — ${site.name}, ${site.city}.`,
  intro:
    "Na shkruani në WhatsApp për porosira, dhurata dhe pyetje mbi aromat. Përgjigjemi nga Prishtina.",
  locationLabel: "Vendndodhja",
  locationLine: `${site.city}, ${site.country}`,
  whatsappLabel: "WhatsApp",
  /** Human-readable number; CTA href stays on `site.primaryCta`. */
  whatsappDisplay: "+383 49 625 317",
  ctaLabel: site.primaryCta.label,
  ctaHref: site.primaryCta.href,
} as const;

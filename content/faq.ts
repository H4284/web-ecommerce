import { site } from "@/content/site";

/** FAQ — Thrio drafts from plan shop settings; client approves. */
export const faq = {
  title: "Pyetje të shpeshta",
  description: `Përgjigje të shkurtra për dorëzimin, pagesën dhe porosité — ${site.name}.`,
  intro: "Përgjigje të shkurtra për blerjen te Sanem. Për detaje ligjore, hap faqet e ndihmës.",
  items: [
    {
      id: "delivery",
      question: "Sa kushton dorëzimi?",
      answer:
        "Dorëzojmë në Kosovë. Tarifa është 2,00 €; transport falas mbi 50,00 €. Zakonisht 1–3 ditë pune.",
    },
    {
      id: "payment",
      question: "Si paguaj?",
      answer:
        "Pagesa është para në dorëzim (Para në dorë). Korrieri merr pagesën kur merrni porosinë.",
    },
    {
      id: "confirm",
      question: "A më telefononi para se të niset porosia?",
      answer:
        "Po. Para dorëzimit ju kontaktojmë me telefon për të konfirmuar porosinë.",
    },
    {
      id: "returns",
      question: "A mund të kthej një produkt?",
      answer:
        "Lexoni faqen Kthimet për afatin dhe hapat. Nëse keni dyshim, na shkruani në WhatsApp.",
    },
    {
      id: "sizes",
      question: "Çfarë madhësish ofroni?",
      answer:
        "Aromat kanë madhësi në mililitra (p.sh. 50 ml dhe 100 ml). Zgjidhni madhësinë në faqen e produktit.",
    },
    {
      id: "contact",
      question: "Si ju kontaktoj?",
      answer:
        "Na shkruani në WhatsApp. Hapni faqen Kontaktoni ose përdorni butonin WhatsApp në sajt.",
    },
  ],
  footerHint: "Nuk e gjetët përgjigjen?",
  footerCtaLabel: "Kontaktoni",
  footerCtaHref: "/kontakt",
} as const;

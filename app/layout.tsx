import type { Metadata } from "next";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";
import { siteUrl } from "@/lib/shop/site-url";

const display = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  variable: "--font-cormorant",
  // optional: avoid a late font swap becoming LCP under mobile throttle
  display: "optional",
});

const body = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-source",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  description: site.tagline,
  alternates: {
    canonical: "/",
  },
};

const storageOrigin =
  process.env.NEXT_PUBLIC_STORAGE_ORIGIN ?? "https://firebasestorage.googleapis.com";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.defaultLocale} className={`${display.variable} ${body.variable}`}>
      <head>
        <link rel="preconnect" href={storageOrigin} />
        <link rel="dns-prefetch" href={storageOrigin} />
      </head>
      <body className="min-h-dvh bg-surface font-body text-ink antialiased">{children}</body>
    </html>
  );
}

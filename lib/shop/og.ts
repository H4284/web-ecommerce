import type { Metadata } from "next";
import { site } from "@/content/site";
import { absoluteUrl } from "@/lib/shop/site-url";

export type OgImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

/** Default share image — `public/og.png` at 1200×630. */
export const defaultOgImage: OgImage = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: `${site.name} — ${site.tagline}`,
};

type OgInput = {
  title: string;
  description: string;
  path?: string;
  images?: OgImage[];
};

function twitterImageUrls(images: OgImage[]): string[] {
  return images.map((img) => img.url);
}

/** Open Graph + Twitter card fields for a page. */
export function socialMetadata({
  title,
  description,
  path = "/",
  images = [defaultOgImage],
}: OgInput): Pick<Metadata, "openGraph" | "twitter"> {
  const url = absoluteUrl(path);
  return {
    openGraph: {
      type: "website",
      locale: site.defaultLocale === "sq" ? "sq_AL" : "en_US",
      siteName: site.name,
      title,
      description,
      url,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: twitterImageUrls(images),
    },
  };
}

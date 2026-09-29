import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const paths = ["", "/koleksioni", "/rreth-nesh", "/kontakt", "/pyetje-te-shpeshta", "/dergesa-dhe-kthime", "/privatesia", "/kushtet"];
  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(site.locales.map((l) => [l, `${base}${path}`])),
    },
  }));
}

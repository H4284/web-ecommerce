import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/shop/sitemap-data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    return await buildSitemapEntries();
  } catch (err) {
    console.error("[sitemap] failed:", err);
    return [{ url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000/" }];
  }
}

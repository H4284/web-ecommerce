import "server-only";
import type { MetadataRoute } from "next";
import { db } from "@/lib/firebase/admin";
import {
  isLegalPlaceholder,
  LEGAL_PAGES,
  readLegalMarkdown,
} from "@/lib/shop/legal-pages";
import { brandSchema, categorySchema, productSchema } from "@/lib/shop/schemas";
import { isPrivatePath } from "@/lib/shop/seo-paths";
import { absoluteUrl } from "@/lib/shop/site-url";

/** Build the public sitemap from Firestore + legal pages. */
export async function buildSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

  function add(path: string, lastModified?: Date) {
    if (isPrivatePath(path)) return;
    const url = absoluteUrl(path === "" ? "/" : path);
    if (seen.has(url)) return;
    seen.add(url);
    entries.push({
      url,
      lastModified: lastModified ?? new Date(),
      changeFrequency: path === "" || path === "/" ? "daily" : "weekly",
      priority: path === "" || path === "/" ? 1 : 0.7,
    });
  }

  add("/");
  add("/kontakt");

  for (const page of LEGAL_PAGES) {
    const md = readLegalMarkdown(page.slug);
    if (isLegalPlaceholder(md)) continue;
    add(`/${page.slug}`);
  }

  const [products, categories, brands] = await Promise.all([
    db.collection("products").where("status", "==", "active").get(),
    db.collection("categories").where("isActive", "==", true).get(),
    db.collection("brands").where("isActive", "==", true).get(),
  ]);

  for (const doc of categories.docs) {
    const parsed = categorySchema.safeParse(doc.data());
    if (!parsed.success) continue;
    add(`/categories/${parsed.data.slug}`, new Date());
  }

  // Brand pages are deferred (plan: brands as pages = no); URLs 301 to collection.
  for (const doc of brands.docs) {
    const parsed = brandSchema.safeParse(doc.data());
    if (!parsed.success) continue;
    add(`/brands/${parsed.data.slug}`, new Date());
  }

  for (const doc of products.docs) {
    const parsed = productSchema.safeParse(doc.data());
    if (!parsed.success) continue;
    const updated = parsed.data.updatedAt
      ? new Date(parsed.data.updatedAt)
      : new Date();
    add(`/products/${parsed.data.slug}`, updated);
  }

  return entries;
}

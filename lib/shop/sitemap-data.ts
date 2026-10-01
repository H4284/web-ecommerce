import "server-only";
import type { MetadataRoute } from "next";
import {
  isLegalPlaceholder,
  LEGAL_PAGES,
  readLegalMarkdown,
} from "@/lib/shop/legal-pages";
import { isPrivatePath } from "@/lib/shop/seo-paths";
import { absoluteUrl } from "@/lib/shop/site-url";
import {
  brandFromRow,
  categoryFromRow,
  productFromRow,
} from "@/lib/shop/supabase-mappers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/** Build the public sitemap from Supabase + legal pages. */
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
  add("/pyetje-te-shpeshta");

  for (const page of LEGAL_PAGES) {
    const md = readLegalMarkdown(page.slug);
    if (isLegalPlaceholder(md)) continue;
    add(`/${page.slug}`);
  }

  const admin = getSupabaseAdmin();
  const [products, categories, brands] = await Promise.all([
    admin.from("products").select("*").eq("status", "active"),
    admin.from("categories").select("*").eq("is_active", true),
    admin.from("brands").select("*").eq("is_active", true),
  ]);
  if (products.error) throw products.error;
  if (categories.error) throw categories.error;
  if (brands.error) throw brands.error;

  for (const row of categories.data ?? []) {
    const parsed = categoryFromRow(row as Record<string, unknown>);
    add(`/categories/${parsed.slug}`, new Date());
  }

  for (const row of brands.data ?? []) {
    const parsed = brandFromRow(row as Record<string, unknown>);
    add(`/brands/${parsed.slug}`, new Date());
  }

  for (const row of products.data ?? []) {
    const parsed = productFromRow(row as Record<string, unknown>);
    const updated = parsed.updatedAt
      ? new Date(parsed.updatedAt)
      : new Date();
    add(`/products/${parsed.slug}`, updated);
  }

  return entries;
}

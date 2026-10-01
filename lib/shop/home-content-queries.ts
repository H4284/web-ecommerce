import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  HOME_CONTENT_PATH,
  homeContentSchema,
  type HomeContent,
} from "@/lib/shop/home-content-schema";
import { buildSeedHomeContent } from "@/lib/shop/seed-home-content";

/** Uncached read. Missing doc → seed-shaped default (not written). */
export async function getHomeContentUncached(): Promise<HomeContent> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("home_content")
    .select("*")
    .eq("id", HOME_CONTENT_PATH.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return buildSeedHomeContent();
  const parsed = homeContentSchema.safeParse({
    heroSlides: data.hero_slides,
    promoBlocks: data.promo_blocks,
    brandStripProductIds: data.brand_strip_product_ids,
  });
  if (!parsed.success) return buildSeedHomeContent();
  return parsed.data;
}

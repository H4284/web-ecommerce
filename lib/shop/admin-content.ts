import "server-only";
import { updateTag } from "next/cache";
import { adminAction } from "@/lib/shop/admin";
import { requireAdmin } from "@/lib/shop/auth";
import { saveHomeContentInputSchema } from "@/lib/shop/admin-content-schema";
import {
  HOME_CONTENT_PATH,
  type HomeContent,
} from "@/lib/shop/home-content-schema";
import { getHomeContentUncached } from "@/lib/shop/home-content-queries";
import {
  ImageTooLargeError,
  resizeAndUploadContentImage,
} from "@/lib/images/product-image";
import { MAX_IMAGE_BYTES } from "@/lib/images/widths";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export { ImageTooLargeError, MAX_IMAGE_BYTES };

async function writeHomeContent(content: HomeContent): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("home_content").upsert({
    id: HOME_CONTENT_PATH.id,
    hero_slides: content.heroSlides,
    promo_blocks: content.promoBlocks,
    brand_strip_product_ids: content.brandStripProductIds,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function getAdminHomeContent(): Promise<HomeContent> {
  await requireAdmin();
  return getHomeContentUncached();
}

export async function saveAdminHomeContent(input: unknown) {
  return adminAction({
    schema: saveHomeContentInputSchema,
    action: "content.home.save",
    target: "content/home",
    input,
    fn: async (data) => {
      await writeHomeContent(data);
      updateTag("content");
      return { ok: true as const };
    },
  });
}

/** Resize + upload hero image; writes path onto the slide and saves the doc. */
export async function uploadAdminHomeHeroImage(opts: {
  slideId: string;
  buffer: Buffer;
  content: HomeContent;
}) {
  await requireAdmin();
  if (opts.buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new ImageTooLargeError();
  }

  const slides = [...opts.content.heroSlides].sort((a, b) => a.order - b.order);
  const idx = slides.findIndex((s) => s.id === opts.slideId);
  if (idx < 0) throw new Error("Slide not found");

  const path = await resizeAndUploadContentImage({
    prefix: "content/home",
    index: idx,
    buffer: opts.buffer,
  });

  const next: HomeContent = {
    ...opts.content,
    heroSlides: opts.content.heroSlides.map((s) =>
      s.id === opts.slideId ? { ...s, imagePath: path } : s,
    ),
  };

  await writeHomeContent(next);
  updateTag("content");
  return { path, content: next };
}

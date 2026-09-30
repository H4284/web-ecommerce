import { z } from "zod";

export const homeHeroSlideSchema = z.object({
  id: z.string().min(1),
  imagePath: z.string().nullable(),
  title: z.string().min(1).max(80),
  subtitle: z.string().max(120),
  link: z.string().min(1).max(200),
  order: z.number().int().nonnegative(),
  active: z.boolean(),
});

export const homePromoBlockSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(80),
  body: z.string().max(400),
  link: z.string().max(200),
  order: z.number().int().nonnegative(),
  active: z.boolean(),
});

export const homeContentSchema = z.object({
  heroSlides: z.array(homeHeroSlideSchema),
  promoBlocks: z.array(homePromoBlockSchema),
  /** Product ids for the brand collage, in display order. */
  brandStripProductIds: z.array(z.string().min(1)),
});

export type HomeHeroSlide = z.infer<typeof homeHeroSlideSchema>;
export type HomePromoBlock = z.infer<typeof homePromoBlockSchema>;
export type HomeContent = z.infer<typeof homeContentSchema>;

export const HOME_CONTENT_PATH = {
  collection: "content",
  id: "home",
} as const;

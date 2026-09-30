import { z } from "zod";
import {
  homeContentSchema,
  homeHeroSlideSchema,
  homePromoBlockSchema,
} from "@/lib/shop/home-content-schema";
import { shopSettingsSchema } from "@/lib/shop/settings-schema";

export const saveHomeContentInputSchema = homeContentSchema;

export type SaveHomeContentInput = z.infer<typeof saveHomeContentInputSchema>;

export const uploadHomeHeroImageInputSchema = z.object({
  slideId: z.string().min(1),
  index: z.number().int().nonnegative(),
});

export const saveShopSettingsInputSchema = shopSettingsSchema;

export type SaveShopSettingsInput = z.infer<typeof saveShopSettingsInputSchema>;

export {
  homeHeroSlideSchema,
  homePromoBlockSchema,
};

import "server-only";
import { unstable_cache } from "next/cache";
import { getShopSettingsUncached } from "@/lib/shop/settings-queries";

/** Cached settings for pages (5 minutes). */
export async function getShopSettings() {
  return unstable_cache(() => getShopSettingsUncached(), ["settings", "shop"], {
    revalidate: 300,
    tags: ["settings"],
  })();
}

export {
  deliveryFeeCents,
  qualifiesForFreeDelivery,
  type DeliveryMethod,
  type PaymentMethod,
  type ShopSettings,
} from "@/lib/shop/settings-schema";

import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { shopSettingsSchema, type ShopSettings } from "@/lib/shop/settings-schema";

const SETTINGS_ID = "shop";

/** Uncached read of shop_settings. */
export async function getShopSettingsUncached(): Promise<ShopSettings> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("shop_settings")
    .select("*")
    .eq("id", SETTINGS_ID)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error("shop_settings/shop is missing — run pnpm seed:supabase");
  }
  return shopSettingsSchema.parse({
    deliveryMethods: data.delivery_methods,
    paymentMethods: data.payment_methods,
    orderPrefix: data.order_prefix,
    ordersInbox: data.orders_inbox,
    company: data.company,
  });
}

export const SETTINGS_PATH = { collection: "settings", id: "shop" } as const;

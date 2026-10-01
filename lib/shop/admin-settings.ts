import "server-only";
import { updateTag } from "next/cache";
import { adminAction } from "@/lib/shop/admin";
import { requireAdmin } from "@/lib/shop/auth";
import { saveShopSettingsInputSchema } from "@/lib/shop/admin-content-schema";
import { getShopSettingsUncached } from "@/lib/shop/settings-queries";
import type { ShopSettings } from "@/lib/shop/settings-schema";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function getAdminShopSettings(): Promise<ShopSettings> {
  await requireAdmin();
  return getShopSettingsUncached();
}

export async function saveAdminShopSettings(input: unknown) {
  return adminAction({
    schema: saveShopSettingsInputSchema,
    action: "settings.save",
    target: "settings/shop",
    input,
    fn: async (data) => {
      const admin = getSupabaseAdmin();
      const { error } = await admin.from("shop_settings").upsert({
        id: "shop",
        delivery_methods: data.deliveryMethods,
        payment_methods: data.paymentMethods,
        order_prefix: data.orderPrefix,
        orders_inbox: data.ordersInbox,
        company: data.company,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      updateTag("settings");
      return { ok: true as const };
    },
  });
}

/** Newsletter list not migrated yet — empty CSV with header. */
export async function exportNewsletterCsv(): Promise<string> {
  await requireAdmin();
  return "\uFEFFemail,createdAt\n";
}

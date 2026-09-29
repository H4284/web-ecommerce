import "server-only";
import { db } from "@/lib/firebase/admin";
import { shopSettingsSchema, type ShopSettings } from "@/lib/shop/settings-schema";

const SETTINGS_PATH = { collection: "settings", id: "shop" } as const;

/** Uncached read of settings/shop. Order routes use this inside transactions. */
export async function getShopSettingsUncached(): Promise<ShopSettings> {
  const snap = await db.collection(SETTINGS_PATH.collection).doc(SETTINGS_PATH.id).get();
  if (!snap.exists) {
    throw new Error("settings/shop is missing — run pnpm seed");
  }
  return shopSettingsSchema.parse(snap.data());
}

export { SETTINGS_PATH };

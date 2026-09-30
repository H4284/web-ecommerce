import "server-only";
import { updateTag } from "next/cache";
import { db } from "@/lib/firebase/admin";
import { adminAction } from "@/lib/shop/admin";
import { requireAdmin } from "@/lib/shop/auth";
import { saveShopSettingsInputSchema } from "@/lib/shop/admin-content-schema";
import { SETTINGS_PATH } from "@/lib/shop/settings-queries";
import { getShopSettingsUncached } from "@/lib/shop/settings-queries";
import type { ShopSettings } from "@/lib/shop/settings-schema";

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
      await db
        .collection(SETTINGS_PATH.collection)
        .doc(SETTINGS_PATH.id)
        .set(data, { merge: false });
      updateTag("settings");
      return { ok: true as const };
    },
  });
}

/** UTF-8 CSV with BOM of newsletter emails (if any). */
export async function exportNewsletterCsv(): Promise<string> {
  await requireAdmin();
  const snap = await db.collection("newsletter").limit(5000).get();
  const header = "email,createdAt";
  const rows = snap.docs.map((doc) => {
    const data = doc.data() as { email?: string; createdAt?: string };
    const email = String(data.email ?? doc.id);
    const createdAt = String(data.createdAt ?? "");
    return [csvEscape(email), csvEscape(createdAt)].join(",");
  });
  return `\uFEFF${header}\n${rows.join("\n")}\n`;
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

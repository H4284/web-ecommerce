"use server";

import {
  exportNewsletterCsv,
  saveAdminShopSettings,
} from "@/lib/shop/admin-settings";

export type SettingsActionResult =
  | { ok: true; csv?: string }
  | { ok: false; error: string };

export async function saveSettingsAction(
  input: unknown,
): Promise<SettingsActionResult> {
  try {
    await saveAdminShopSettings(input);
    return { ok: true };
  } catch (err) {
    console.error("[admin] saveSettings", err);
    return { ok: false, error: "save_failed" };
  }
}

export async function exportNewsletterCsvAction(): Promise<SettingsActionResult> {
  try {
    const csv = await exportNewsletterCsv();
    return { ok: true, csv };
  } catch (err) {
    console.error("[admin] newsletterCsv", err);
    return { ok: false, error: "csv_failed" };
  }
}

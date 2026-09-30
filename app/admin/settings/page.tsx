import type { Metadata } from "next";
import { SettingsAdmin } from "@/components/admin/settings-admin";
import { adminCopy } from "@/content/admin";
import { requireAdmin } from "@/lib/shop/auth";
import { getAdminShopSettings } from "@/lib/shop/admin-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: adminCopy.settings };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getAdminShopSettings();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl tracking-display text-ink">
        {adminCopy.settings}
      </h1>
      <SettingsAdmin initial={settings} />
    </div>
  );
}

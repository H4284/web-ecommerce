import type { Metadata } from "next";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";
import { adminCopy } from "@/content/admin";
import { getAdminDashboard } from "@/lib/shop/admin-dashboard";
import { requireAdmin } from "@/lib/shop/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: adminCopy.dashboard,
};

export default async function AdminHomePage() {
  await requireAdmin();
  const data = await getAdminDashboard();

  return <AdminDashboardView data={data} />;
}

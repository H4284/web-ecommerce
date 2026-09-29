import type { Metadata } from "next";
import { adminCopy } from "@/content/admin";
import { getAdminDashboard } from "@/lib/shop/admin-reads";
import { requireAdmin } from "@/lib/shop/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: adminCopy.dashboard,
};

export default async function AdminHomePage() {
  await requireAdmin();
  const data = await getAdminDashboard();

  return (
    <div>
      <h1 className="font-display text-3xl tracking-display text-ink">
        {adminCopy.dashboard}
      </h1>
      <p className="mt-3 text-ink-muted">{adminCopy.dashboardBody}</p>
      <p className="mt-2 text-sm text-ink-muted">
        {adminCopy.signedInAs}{" "}
        <span className="font-medium text-ink">{data.email}</span>
      </p>
    </div>
  );
}

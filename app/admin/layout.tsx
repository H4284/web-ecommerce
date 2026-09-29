import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { adminCopy } from "@/content/admin";
import { site } from "@/content/site";
import { requireAdmin } from "@/lib/shop/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: adminCopy.title,
    template: `%s · ${adminCopy.title} · ${site.name}`,
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return <AdminShell email={user.email}>{children}</AdminShell>;
}

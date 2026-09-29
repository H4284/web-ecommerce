import { requireAdmin } from "@/lib/shop/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <div className="min-h-dvh bg-surface-2 p-6 text-ink">{children}</div>;
}

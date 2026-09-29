import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/shop/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }
  return <div className="min-h-dvh bg-surface-2 p-6 text-ink">{children}</div>;
}

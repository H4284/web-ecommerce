import type { Metadata } from "next";
import { adminCopy } from "@/content/admin";
import { requireAdmin } from "@/lib/shop/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: adminCopy.brands };

export default async function AdminBrandsPage() {
  await requireAdmin();
  return (
    <div>
      <h1 className="font-display text-3xl tracking-display">{adminCopy.brands}</h1>
      <p className="mt-3 text-ink-muted">{adminCopy.placeholder}</p>
    </div>
  );
}

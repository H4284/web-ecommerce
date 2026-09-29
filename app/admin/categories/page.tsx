import type { Metadata } from "next";
import { adminCopy } from "@/content/admin";
import { requireAdmin } from "@/lib/shop/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: adminCopy.categories };

export default async function AdminCategoriesPage() {
  await requireAdmin();
  return (
    <div>
      <h1 className="font-display text-3xl tracking-display">{adminCopy.categories}</h1>
      <p className="mt-3 text-ink-muted">{adminCopy.placeholder}</p>
    </div>
  );
}

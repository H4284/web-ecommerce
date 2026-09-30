import type { Metadata } from "next";
import { CategoriesAdmin } from "@/components/admin/categories-admin";
import { adminCopy } from "@/content/admin";
import { requireAdmin } from "@/lib/shop/auth";
import { listAdminTaxonomyCategories } from "@/lib/shop/admin-taxonomy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: adminCopy.categories };

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await listAdminTaxonomyCategories();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl tracking-display text-ink">
        {adminCopy.categories}
      </h1>
      <CategoriesAdmin categories={categories} />
    </div>
  );
}

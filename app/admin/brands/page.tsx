import type { Metadata } from "next";
import { BrandsAdmin } from "@/components/admin/brands-admin";
import { adminCopy } from "@/content/admin";
import { requireAdmin } from "@/lib/shop/auth";
import { listAdminTaxonomyBrands } from "@/lib/shop/admin-taxonomy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: adminCopy.brands };

export default async function AdminBrandsPage() {
  await requireAdmin();
  const brands = await listAdminTaxonomyBrands();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl tracking-display text-ink">
        {adminCopy.brands}
      </h1>
      <BrandsAdmin brands={brands} />
    </div>
  );
}

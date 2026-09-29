import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { adminCopy } from "@/content/admin";
import { requireAdmin } from "@/lib/shop/auth";
import {
  listAdminBrands,
  listAdminCategories,
} from "@/lib/shop/admin-products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: adminCopy.productNew };

export default async function AdminNewProductPage() {
  await requireAdmin();
  const [brands, categories] = await Promise.all([
    listAdminBrands(),
    listAdminCategories(),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl tracking-display text-ink">
        {adminCopy.productNew}
      </h1>
      <ProductForm
        product={null}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}

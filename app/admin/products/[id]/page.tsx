import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { adminCopy } from "@/content/admin";
import { requireAdmin } from "@/lib/shop/auth";
import {
  getAdminProduct,
  listAdminBrands,
  listAdminCategories,
} from "@/lib/shop/admin-products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: adminCopy.productEdit };

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminEditProductPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const [product, brands, categories] = await Promise.all([
    getAdminProduct(id),
    listAdminBrands(),
    listAdminCategories(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl tracking-display text-ink">
        {adminCopy.productEdit}
      </h1>
      <ProductForm
        product={product}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}

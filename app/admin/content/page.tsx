import type { Metadata } from "next";
import { ContentAdmin } from "@/components/admin/content-admin";
import { adminCopy } from "@/content/admin";
import { requireAdmin } from "@/lib/shop/auth";
import { getAdminHomeContent } from "@/lib/shop/admin-content";
import { listProducts } from "@/lib/shop/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: adminCopy.content };

export default async function AdminContentPage() {
  await requireAdmin();
  const [content, listed] = await Promise.all([
    getAdminHomeContent(),
    listProducts({ page: 1, pageSize: 48, sort: "newest" }),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl tracking-display text-ink">
        {adminCopy.content}
      </h1>
      <ContentAdmin
        initial={content}
        productOptions={listed.items.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}

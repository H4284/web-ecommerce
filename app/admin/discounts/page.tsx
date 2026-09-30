import type { Metadata } from "next";
import { DiscountsAdmin } from "@/components/admin/discounts-admin";
import { adminCopy } from "@/content/admin";
import { requireAdmin } from "@/lib/shop/auth";
import { listAdminDiscounts } from "@/lib/shop/admin-discounts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: adminCopy.discounts };

export default async function AdminDiscountsPage() {
  await requireAdmin();
  const discounts = await listAdminDiscounts();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl tracking-display text-ink">
        {adminCopy.discounts}
      </h1>
      <DiscountsAdmin discounts={discounts} />
    </div>
  );
}

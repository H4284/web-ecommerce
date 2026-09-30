import "server-only";
import { updateTag } from "next/cache";
import { db } from "@/lib/firebase/admin";
import { adminAction } from "@/lib/shop/admin";
import { requireAdmin } from "@/lib/shop/auth";
import {
  saveDiscountInputSchema,
  setDiscountActiveInputSchema,
  type AdminDiscount,
} from "@/lib/shop/admin-discount-schema";
import { discountSchema, type DiscountDoc } from "@/lib/shop/discounts";

export type { AdminDiscount };

export async function listAdminDiscounts(): Promise<AdminDiscount[]> {
  await requireAdmin();
  const snap = await db.collection("discounts").get();
  const items: AdminDiscount[] = [];
  for (const doc of snap.docs) {
    const parsed = discountSchema.safeParse(doc.data());
    if (!parsed.success) continue;
    items.push({ code: doc.id, ...parsed.data });
  }
  return items.sort((a, b) => a.code.localeCompare(b.code));
}

export async function getAdminDiscount(
  code: string,
): Promise<AdminDiscount | null> {
  await requireAdmin();
  const id = code.trim().toUpperCase();
  const snap = await db.collection("discounts").doc(id).get();
  if (!snap.exists) return null;
  const parsed = discountSchema.safeParse(snap.data());
  if (!parsed.success) return null;
  return { code: snap.id, ...parsed.data };
}

/** Create or update. usedCount is preserved on update; 0 on create. */
export async function saveAdminDiscount(input: unknown) {
  return adminAction({
    schema: saveDiscountInputSchema,
    action: "discount.save",
    target: (d) => `discounts/${d.code}`,
    input,
    fn: async (data) => {
      const ref = db.collection("discounts").doc(data.code);
      const existing = await ref.get();
      const usedCount = existing.exists
        ? Number(existing.data()?.usedCount ?? 0)
        : 0;

      const doc: DiscountDoc = discountSchema.parse({
        type: data.type,
        value: data.value,
        minSubtotalCents: data.minSubtotalCents,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        usageLimit: data.usageLimit,
        usedCount: Number.isInteger(usedCount) && usedCount >= 0 ? usedCount : 0,
        active: data.active,
      });

      await ref.set(doc, { merge: false });
      updateTag("catalog");
      return { code: data.code, usedCount: doc.usedCount };
    },
  });
}

export async function setAdminDiscountActive(input: unknown) {
  return adminAction({
    schema: setDiscountActiveInputSchema,
    action: "discount.setActive",
    target: (d) => `discounts/${d.code}`,
    input,
    fn: async (data) => {
      const ref = db.collection("discounts").doc(data.code);
      const snap = await ref.get();
      if (!snap.exists) throw new Error("Discount not found");
      await ref.update({ active: data.active });
      updateTag("catalog");
      return { code: data.code, active: data.active };
    },
  });
}

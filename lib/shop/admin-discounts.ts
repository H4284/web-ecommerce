import "server-only";
import { updateTag } from "next/cache";
import { adminAction } from "@/lib/shop/admin";
import { requireAdmin } from "@/lib/shop/auth";
import {
  saveDiscountInputSchema,
  setDiscountActiveInputSchema,
  type AdminDiscount,
} from "@/lib/shop/admin-discount-schema";
import { discountSchema, type DiscountDoc } from "@/lib/shop/discounts";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type { AdminDiscount };

function mapDiscount(row: Record<string, unknown>): AdminDiscount | null {
  const parsed = discountSchema.safeParse({
    type: row.type,
    value: row.value,
    minSubtotalCents: row.min_subtotal_cents,
    startsAt:
      typeof row.starts_at === "string"
        ? row.starts_at
        : new Date(row.starts_at as string).toISOString(),
    endsAt:
      typeof row.ends_at === "string"
        ? row.ends_at
        : new Date(row.ends_at as string).toISOString(),
    usageLimit: row.usage_limit,
    usedCount: row.used_count,
    active: row.active,
  });
  if (!parsed.success) return null;
  return { code: String(row.code), ...parsed.data };
}

export async function listAdminDiscounts(): Promise<AdminDiscount[]> {
  await requireAdmin();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("discounts").select("*");
  if (error) throw error;
  const items: AdminDiscount[] = [];
  for (const row of data ?? []) {
    const mapped = mapDiscount(row as Record<string, unknown>);
    if (mapped) items.push(mapped);
  }
  return items.sort((a, b) => a.code.localeCompare(b.code));
}

export async function getAdminDiscount(
  code: string,
): Promise<AdminDiscount | null> {
  await requireAdmin();
  const id = code.trim().toUpperCase();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("discounts")
    .select("*")
    .eq("code", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapDiscount(data as Record<string, unknown>);
}

/** Create or update. usedCount is preserved on update; 0 on create. */
export async function saveAdminDiscount(input: unknown) {
  return adminAction({
    schema: saveDiscountInputSchema,
    action: "discount.save",
    target: (d) => `discounts/${d.code}`,
    input,
    fn: async (data) => {
      const admin = getSupabaseAdmin();
      const { data: existing } = await admin
        .from("discounts")
        .select("used_count")
        .eq("code", data.code)
        .maybeSingle();
      const usedCount = existing
        ? Number(existing.used_count ?? 0)
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

      const { error } = await admin.from("discounts").upsert({
        code: data.code,
        type: doc.type,
        value: doc.value,
        min_subtotal_cents: doc.minSubtotalCents,
        starts_at: doc.startsAt,
        ends_at: doc.endsAt,
        usage_limit: doc.usageLimit,
        used_count: doc.usedCount,
        active: doc.active,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
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
      const admin = getSupabaseAdmin();
      const { data: existing, error: gErr } = await admin
        .from("discounts")
        .select("code")
        .eq("code", data.code)
        .maybeSingle();
      if (gErr) throw gErr;
      if (!existing) throw new Error("Discount not found");
      const { error } = await admin
        .from("discounts")
        .update({
          active: data.active,
          updated_at: new Date().toISOString(),
        })
        .eq("code", data.code);
      if (error) throw error;
      updateTag("catalog");
      return { code: data.code, active: data.active };
    },
  });
}

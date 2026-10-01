import "server-only";
import { mergeCartLines, type CartLineInput } from "@/lib/shop/cart-schema";
import {
  discountSchema,
  evaluateDiscount,
  type DiscountDoc,
  type DiscountResult,
} from "@/lib/shop/discounts";
import { getShopSettingsUncached } from "@/lib/shop/settings-queries";
import { getProductById, getVariant } from "@/lib/shop/catalog-queries";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { variantLabel } from "@/lib/shop/variants";
import { shopCopy } from "@/content/shop";
import type { DeliveryMethod } from "@/lib/shop/settings-schema";

export type ValidatedCartLine = {
  variantId: string;
  productId: string;
  productSlug: string;
  sku: string;
  name: string;
  variantLabel: string;
  imagePath: string | null;
  priceCents: number;
  compareAtCents: number | null;
  qty: number;
  maxQty: number;
};

export type CartValidateResult = {
  lines: ValidatedCartLine[];
  messages: string[];
  subtotalCents: number;
  discount: DiscountResult;
  deliveryMethods: DeliveryMethod[];
};

async function loadDiscount(code: string): Promise<DiscountDoc | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("discounts")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const parsed = discountSchema.safeParse({
    type: data.type,
    value: data.value,
    minSubtotalCents: data.min_subtotal_cents,
    startsAt:
      typeof data.starts_at === "string"
        ? data.starts_at
        : new Date(data.starts_at as string).toISOString(),
    endsAt:
      typeof data.ends_at === "string"
        ? data.ends_at
        : new Date(data.ends_at as string).toISOString(),
    usageLimit: data.usage_limit,
    usedCount: data.used_count,
    active: data.active,
  });
  if (!parsed.success) return null;
  return parsed.data;
}

/** Uncached cart validation against live Supabase prices and stock. */
export async function validateCart(input: {
  lines: CartLineInput[];
  discountCode?: string | null;
  now?: Date;
}): Promise<CartValidateResult> {
  const messages: string[] = [];
  const merged = mergeCartLines(input.lines);
  if (merged.length < input.lines.length) {
    messages.push(shopCopy.cartMerged);
  }

  const lines: ValidatedCartLine[] = [];

  for (const row of merged) {
    const product = await getProductById(row.productId);
    if (!product || product.status !== "active") {
      messages.push(shopCopy.cartProductUnavailable);
      continue;
    }

    const variant = await getVariant(row.productId, row.variantId);
    if (!variant) {
      messages.push(shopCopy.cartVariantMissing);
      continue;
    }

    const maxQty = Math.min(99, Math.max(0, variant.stock));
    if (maxQty <= 0) {
      messages.push(shopCopy.cartProductUnavailable);
      continue;
    }

    let qty = row.qty;
    if (qty > maxQty) {
      qty = maxQty;
      messages.push(shopCopy.cartQtyClamped);
    }
    qty = Math.min(99, Math.max(1, qty));

    const imagePath = variant.image?.path ?? product.images[0]?.path ?? null;
    lines.push({
      variantId: variant.id,
      productId: product.id,
      productSlug: product.slug,
      sku: variant.sku,
      name: product.name,
      variantLabel: variantLabel(product.options, variant),
      imagePath,
      priceCents: variant.priceCents,
      compareAtCents: variant.compareAtCents ?? null,
      qty,
      maxQty,
    });
  }

  let subtotalCents = 0;
  for (const line of lines) {
    subtotalCents += line.priceCents * line.qty;
  }

  const code = input.discountCode?.trim() || null;
  const discountDoc = code ? await loadDiscount(code) : null;
  const discount = evaluateDiscount(code, discountDoc, subtotalCents, input.now);

  const settings = await getShopSettingsUncached();
  const deliveryMethods = settings.deliveryMethods.filter((m) => m.active);

  return {
    lines,
    messages: [...new Set(messages)],
    subtotalCents,
    discount,
    deliveryMethods,
  };
}

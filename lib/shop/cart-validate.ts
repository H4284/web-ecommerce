import "server-only";
import { db } from "@/lib/firebase/admin";
import { mergeCartLines, type CartLineInput } from "@/lib/shop/cart-schema";
import {
  discountSchema,
  evaluateDiscount,
  type DiscountDoc,
  type DiscountResult,
} from "@/lib/shop/discounts";
import { getShopSettingsUncached } from "@/lib/shop/settings-queries";
import {
  productSchema,
  variantSchema,
  type Product,
  type Variant,
} from "@/lib/shop/schemas";
import { variantLabel } from "@/lib/shop/variants";
import { shopCopy } from "@/content/shop";
import type { DeliveryMethod } from "@/lib/shop/settings-schema";

export type ValidatedCartLine = {
  variantId: string;
  productId: string;
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

type ProductDoc = Product & { id: string };
type VariantDoc = Variant & { id: string };

async function loadProduct(productId: string): Promise<ProductDoc | null> {
  const snap = await db.collection("products").doc(productId).get();
  if (!snap.exists) return null;
  const parsed = productSchema.safeParse(snap.data());
  if (!parsed.success) return null;
  return { id: snap.id, ...parsed.data };
}

async function loadVariant(
  productId: string,
  variantId: string,
): Promise<VariantDoc | null> {
  const snap = await db
    .collection("products")
    .doc(productId)
    .collection("variants")
    .doc(variantId)
    .get();
  if (!snap.exists) return null;
  const parsed = variantSchema.safeParse(snap.data());
  if (!parsed.success) return null;
  return { id: snap.id, ...parsed.data };
}

async function loadDiscount(code: string): Promise<DiscountDoc | null> {
  const snap = await db.collection("discounts").doc(code.toUpperCase()).get();
  if (!snap.exists) return null;
  const parsed = discountSchema.safeParse(snap.data());
  if (!parsed.success) return null;
  return parsed.data;
}

/** Uncached cart validation against live Firestore prices and stock. */
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
    const product = await loadProduct(row.productId);
    if (!product || product.status !== "active") {
      messages.push(shopCopy.cartProductUnavailable);
      continue;
    }

    const variant = await loadVariant(row.productId, row.variantId);
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

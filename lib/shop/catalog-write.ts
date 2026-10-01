import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { productSchema } from "@/lib/shop/schemas";
import { searchTokens } from "@/lib/shop/search";
import { productFromRow, productToRow } from "@/lib/shop/supabase-mappers";

/** Recompute denormalised product fields from its variants (+ brand name for tokens). */
export async function recomputeProduct(productId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data: productRow, error: pErr } = await admin
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!productRow) {
    throw new Error(`recomputeProduct: missing product ${productId}`);
  }

  const product = productFromRow(productRow as Record<string, unknown>);
  const { data: variantRows, error: vErr } = await admin
    .from("variants")
    .select("*")
    .eq("product_id", productId);
  if (vErr) throw vErr;

  let minPriceCents = Number.POSITIVE_INFINITY;
  let maxPriceCents = 0;
  let totalStock = 0;
  let defaultVariantId: string | null = null;

  for (const row of variantRows ?? []) {
    const price = Number((row as { price_cents?: unknown }).price_cents);
    const stock = Number((row as { stock?: unknown }).stock);
    if (!Number.isInteger(price) || !Number.isInteger(stock)) continue;
    minPriceCents = Math.min(minPriceCents, price);
    maxPriceCents = Math.max(maxPriceCents, price);
    totalStock += stock;
    if ((row as { is_default?: unknown }).is_default === true) {
      defaultVariantId = String((row as { id: string }).id);
    }
  }

  if (!Number.isFinite(minPriceCents)) {
    minPriceCents = 0;
  }

  let brandName = "";
  if (product.brandId) {
    const { data: brand } = await admin
      .from("brands")
      .select("name")
      .eq("id", product.brandId)
      .maybeSingle();
    brandName = brand?.name ? String(brand.name) : "";
  }

  const tokens = searchTokens(product.name, brandName);

  const next = productSchema.parse({
    ...product,
    searchTokens: tokens,
    minPriceCents,
    maxPriceCents,
    totalStock,
    defaultVariantId,
    updatedAt: new Date().toISOString(),
  });

  const { error } = await admin
    .from("products")
    .update(productToRow({ id: productId, ...next }))
    .eq("id", productId);
  if (error) throw error;
}

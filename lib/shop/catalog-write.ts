import "server-only";
import { db } from "@/lib/firebase/admin";
import { productSchema } from "@/lib/shop/schemas";
import { searchTokens } from "@/lib/shop/search";

/** Recompute denormalised product fields from its variants (+ brand name for tokens). */
export async function recomputeProduct(productId: string): Promise<void> {
  const productRef = db.collection("products").doc(productId);
  const productSnap = await productRef.get();
  if (!productSnap.exists) {
    throw new Error(`recomputeProduct: missing product ${productId}`);
  }

  const product = productSnap.data() ?? {};
  const variantsSnap = await productRef.collection("variants").get();
  const variants = variantsSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as {
      priceCents?: unknown;
      stock?: unknown;
      isDefault?: unknown;
    }),
  }));

  let minPriceCents = Number.POSITIVE_INFINITY;
  let maxPriceCents = 0;
  let totalStock = 0;
  let defaultVariantId: string | null = null;

  for (const v of variants) {
    const price = Number(v.priceCents);
    const stock = Number(v.stock);
    if (!Number.isInteger(price) || !Number.isInteger(stock)) continue;
    minPriceCents = Math.min(minPriceCents, price);
    maxPriceCents = Math.max(maxPriceCents, price);
    totalStock += stock;
    if (v.isDefault === true) defaultVariantId = v.id;
  }

  if (!Number.isFinite(minPriceCents)) {
    minPriceCents = 0;
    maxPriceCents = 0;
  }

  if (!defaultVariantId && variants.length > 0) {
    const inStock = variants.find((v) => Number(v.stock) > 0);
    defaultVariantId = (inStock ?? variants[0]).id;
  }

  let brandName: string | null = null;
  if (typeof product.brandId === "string" && product.brandId) {
    const brandSnap = await db.collection("brands").doc(product.brandId).get();
    brandName = (brandSnap.data()?.name as string | undefined) ?? null;
  }

  const tokens = searchTokens(String(product.name ?? ""), brandName);
  const updatedAt = new Date().toISOString();

  const next = productSchema.parse({
    ...product,
    searchTokens: tokens,
    minPriceCents,
    maxPriceCents,
    totalStock,
    defaultVariantId,
    updatedAt,
  });

  await productRef.set(next, { merge: true });
}

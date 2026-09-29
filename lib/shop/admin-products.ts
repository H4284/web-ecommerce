import "server-only";
import { updateTag } from "next/cache";
import { db } from "@/lib/firebase/admin";
import { adminAction } from "@/lib/shop/admin";
import { requireAdmin } from "@/lib/shop/auth";
import { recomputeProduct } from "@/lib/shop/catalog-write";
import {
  bulkProductStatusSchema,
  saveProductInputSchema,
  updateStockInputSchema,
  variantIdFromOptions,
  type BulkProductStatusInput,
  type SaveProductInput,
  type UpdateStockInput,
} from "@/lib/shop/admin-product-schema";
import {
  brandSchema,
  categorySchema,
  productSchema,
  variantSchema,
  type Brand,
  type Category,
  type Product,
  type Variant,
} from "@/lib/shop/schemas";

export class StockConflictError extends Error {
  constructor() {
    super("stock_changed");
    this.name = "StockConflictError";
  }
}

export type AdminProductRow = Product & { id: string };
export type AdminVariantRow = Variant & { id: string };
export type AdminProductDetail = AdminProductRow & {
  variants: AdminVariantRow[];
};

export async function listAdminProducts(): Promise<AdminProductRow[]> {
  await requireAdmin();
  const snap = await db.collection("products").orderBy("updatedAt", "desc").get();
  const items: AdminProductRow[] = [];
  for (const doc of snap.docs) {
    const parsed = productSchema.safeParse(doc.data());
    if (parsed.success) items.push({ id: doc.id, ...parsed.data });
  }
  return items;
}

export async function getAdminProduct(
  id: string,
): Promise<AdminProductDetail | null> {
  await requireAdmin();
  const ref = db.collection("products").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const parsed = productSchema.safeParse(snap.data());
  if (!parsed.success) return null;
  const variantsSnap = await ref.collection("variants").get();
  const variants: AdminVariantRow[] = [];
  for (const v of variantsSnap.docs) {
    const vp = variantSchema.safeParse(v.data());
    if (vp.success) variants.push({ id: v.id, ...vp.data });
  }
  return { id: snap.id, ...parsed.data, variants };
}

export async function listAdminCategories(): Promise<Array<Category & { id: string }>> {
  await requireAdmin();
  const snap = await db.collection("categories").orderBy("order", "asc").get();
  const items: Array<Category & { id: string }> = [];
  for (const doc of snap.docs) {
    const parsed = categorySchema.safeParse(doc.data());
    if (parsed.success) items.push({ id: doc.id, ...parsed.data });
  }
  return items;
}

export async function listAdminBrands(): Promise<Array<Brand & { id: string }>> {
  await requireAdmin();
  const snap = await db.collection("brands").get();
  const items: Array<Brand & { id: string }> = [];
  for (const doc of snap.docs) {
    const parsed = brandSchema.safeParse(doc.data());
    if (parsed.success) items.push({ id: doc.id, ...parsed.data });
  }
  return items;
}

export async function saveAdminProduct(input: unknown) {
  return adminAction({
    schema: saveProductInputSchema,
    action: "product.save",
    target: (d) => `products/${d.id ?? d.slug}`,
    input,
    fn: async (data) => writeProduct(data),
  });
}

export async function updateAdminStock(input: unknown) {
  return adminAction({
    schema: updateStockInputSchema,
    action: "product.stock",
    target: (d) => `products/${d.productId}/variants/${d.variantId}`,
    input,
    fn: async (data) => writeStock(data),
  });
}

export async function bulkSetProductStatus(input: unknown) {
  return adminAction({
    schema: bulkProductStatusSchema,
    action: "product.bulkStatus",
    target: (d) => `products:${d.ids.join(",")}`,
    input,
    fn: async (data) => writeBulkStatus(data),
  });
}

async function writeProduct(data: SaveProductInput): Promise<{ id: string }> {
  const productId = data.id ?? db.collection("products").doc().id;
  const productRef = db.collection("products").doc(productId);
  const existing = await productRef.get();
  const now = new Date().toISOString();
  const createdAt =
    existing.exists && typeof existing.data()?.createdAt === "string"
      ? (existing.data()!.createdAt as string)
      : now;

  const images = data.id
    ? data.images.length > 0
      ? data.images
      : [{ path: `products/${productId}/0`, alt: data.name }]
    : [{ path: `products/${productId}/0`, alt: data.name }];

  const productDoc = productSchema.parse({
    name: data.name,
    slug: data.slug,
    brandId: data.brandId,
    categoryIds: data.categoryIds,
    shortDescription: data.shortDescription,
    description: data.description,
    images,
    options: data.options,
    status: data.status,
    isNew: data.isNew,
    isBestSeller: data.isBestSeller,
    unit: data.unit,
    relatedIds: data.relatedIds,
    searchTokens: [],
    minPriceCents: 0,
    maxPriceCents: 0,
    totalStock: 0,
    defaultVariantId: null,
    createdAt,
    updatedAt: now,
    ...(data.seoTitle || data.seoDescription
      ? {
          seo: {
            ...(data.seoTitle ? { title: data.seoTitle } : {}),
            ...(data.seoDescription ? { description: data.seoDescription } : {}),
          },
        }
      : {}),
  });

  const existingVariants = existing.exists
    ? await productRef.collection("variants").get()
    : null;
  const existingIds = new Set(existingVariants?.docs.map((d) => d.id) ?? []);

  const batch = db.batch();
  batch.set(productRef, productDoc, { merge: true });

  let defaultId: string | null = null;
  for (const v of data.variants) {
    const vid = v.id || variantIdFromOptions(v.optionValues);
    if (v.isDefault) defaultId = vid;
    const vref = productRef.collection("variants").doc(vid);
    if (existingIds.has(vid)) {
      batch.set(
        vref,
        {
          sku: v.sku,
          optionValues: v.optionValues,
          priceCents: v.priceCents,
          compareAtCents: v.compareAtCents,
          isDefault: v.isDefault,
          image: null,
        },
        { merge: true },
      );
    } else {
      const variantDoc = variantSchema.parse({
        sku: v.sku,
        optionValues: v.optionValues,
        priceCents: v.priceCents,
        compareAtCents: v.compareAtCents,
        stock: v.stock,
        isDefault: v.isDefault,
        image: null,
      });
      batch.set(vref, variantDoc);
    }
  }

  if (defaultId) {
    batch.set(productRef, { defaultVariantId: defaultId }, { merge: true });
  }

  await batch.commit();
  await recomputeProduct(productId);
  updateTag("catalog");
  return { id: productId };
}

async function writeStock(data: UpdateStockInput): Promise<{ stock: number }> {
  const ref = db
    .collection("products")
    .doc(data.productId)
    .collection("variants")
    .doc(data.variantId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Variant not found");
    const current = Number(snap.data()?.stock);
    if (current !== data.expectedStock) {
      throw new StockConflictError();
    }
    tx.update(ref, { stock: data.nextStock });
  });

  await recomputeProduct(data.productId);
  updateTag("catalog");
  return { stock: data.nextStock };
}

async function writeBulkStatus(
  data: BulkProductStatusInput,
): Promise<{ count: number }> {
  const batch = db.batch();
  const now = new Date().toISOString();
  for (const id of data.ids) {
    batch.set(
      db.collection("products").doc(id),
      { status: data.status, updatedAt: now },
      { merge: true },
    );
  }
  await batch.commit();
  updateTag("catalog");
  return { count: data.ids.length };
}

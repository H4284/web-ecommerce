import "server-only";
import { updateTag } from "next/cache";
import { randomBytes } from "node:crypto";
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
  productSchema,
  variantSchema,
  type Brand,
  type Category,
  type Product,
  type Variant,
} from "@/lib/shop/schemas";
import {
  brandFromRow,
  categoryFromRow,
  productFromRow,
  productToRow,
  variantFromRow,
  variantToRow,
} from "@/lib/shop/supabase-mappers";
import { createPgClient } from "@/lib/supabase/pg";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("products")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) =>
    productFromRow(row as Record<string, unknown>),
  );
}

export async function getAdminProduct(
  id: string,
): Promise<AdminProductDetail | null> {
  await requireAdmin();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: variants, error: vErr } = await admin
    .from("variants")
    .select("*")
    .eq("product_id", id);
  if (vErr) throw vErr;

  return {
    ...productFromRow(data as Record<string, unknown>),
    variants: (variants ?? []).map((row) =>
      variantFromRow(row as Record<string, unknown>),
    ),
  };
}

export async function listAdminCategories(): Promise<Array<Category & { id: string }>> {
  await requireAdmin();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("categories")
    .select("*")
    .order("order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) =>
    categoryFromRow(row as Record<string, unknown>),
  );
}

export async function listAdminBrands(): Promise<Array<Brand & { id: string }>> {
  await requireAdmin();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("brands").select("*");
  if (error) throw error;
  return (data ?? []).map((row) => brandFromRow(row as Record<string, unknown>));
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
  const admin = getSupabaseAdmin();
  const productId = data.id ?? randomBytes(8).toString("hex");
  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  const createdAt = existing?.created_at
    ? String(existing.created_at)
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

  const { error: pErr } = await admin
    .from("products")
    .upsert(productToRow({ id: productId, ...productDoc }));
  if (pErr) throw pErr;

  const { data: existingVariants } = await admin
    .from("variants")
    .select("id")
    .eq("product_id", productId);
  const existingIds = new Set((existingVariants ?? []).map((v) => String(v.id)));

  let defaultId: string | null = null;
  for (const v of data.variants) {
    const vid = v.id || variantIdFromOptions(v.optionValues);
    if (v.isDefault) defaultId = vid;

    if (existingIds.has(vid)) {
      const { error } = await admin
        .from("variants")
        .update({
          sku: v.sku,
          option_values: v.optionValues,
          price_cents: v.priceCents,
          compare_at_cents: v.compareAtCents,
          is_default: v.isDefault,
          updated_at: now,
        })
        .eq("product_id", productId)
        .eq("id", vid);
      if (error) throw error;
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
      const { error } = await admin
        .from("variants")
        .insert(variantToRow(productId, { id: vid, ...variantDoc }));
      if (error) throw error;
    }
  }

  if (defaultId) {
    const { error } = await admin
      .from("products")
      .update({ default_variant_id: defaultId, updated_at: now })
      .eq("id", productId);
    if (error) throw error;
  }

  await recomputeProduct(productId);
  updateTag("catalog");
  return { id: productId };
}

async function writeStock(data: UpdateStockInput): Promise<{ stock: number }> {
  const client = createPgClient();
  await client.connect();
  try {
    await client.query("begin");
    const res = await client.query(
      `select stock from variants where product_id = $1 and id = $2 for update`,
      [data.productId, data.variantId],
    );
    if (!res.rowCount) throw new Error("Variant not found");
    const current = Number(res.rows[0].stock);
    if (current !== data.expectedStock) {
      throw new StockConflictError();
    }
    await client.query(
      `update variants set stock = $1, updated_at = $2 where product_id = $3 and id = $4`,
      [data.nextStock, new Date().toISOString(), data.productId, data.variantId],
    );
    await client.query("commit");
  } catch (err) {
    try {
      await client.query("rollback");
    } catch {
      // ignore
    }
    throw err;
  } finally {
    await client.end();
  }

  await recomputeProduct(data.productId);
  updateTag("catalog");
  return { stock: data.nextStock };
}

async function writeBulkStatus(
  data: BulkProductStatusInput,
): Promise<{ count: number }> {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await admin
    .from("products")
    .update({ status: data.status, updated_at: now })
    .in("id", data.ids);
  if (error) throw error;
  updateTag("catalog");
  return { count: data.ids.length };
}

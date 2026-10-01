import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
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
import {
  brandFromRow,
  categoryFromRow,
  productFromRow,
  variantFromRow,
} from "@/lib/shop/supabase-mappers";

export type CategoryDoc = Category & { id: string };
export type BrandDoc = Brand & { id: string };
export type ProductDoc = Product & { id: string };
export type VariantDoc = Variant & { id: string };
export type ProductWithVariants = ProductDoc & { variants: VariantDoc[] };

export type ProductSort = "newest" | "price-asc" | "price-desc" | "best-sellers";

export type ListProductsInput = {
  categoryId?: string;
  brandId?: string;
  page?: number;
  pageSize?: number;
  sort?: ProductSort;
};

export type CategoryTreeNode = CategoryDoc & { children: CategoryDoc[] };

function logBad(collection: string, id: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[catalog] skip ${collection}/${id}: ${message}`);
}

function parseCategory(raw: CategoryDoc): CategoryDoc | null {
  const { id, ...data } = raw;
  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) {
    logBad("categories", id, parsed.error.issues[0]?.message ?? parsed.error);
    return null;
  }
  return { id, ...parsed.data };
}

function parseBrand(raw: BrandDoc): BrandDoc | null {
  const { id, ...data } = raw;
  const parsed = brandSchema.safeParse(data);
  if (!parsed.success) {
    logBad("brands", id, parsed.error.issues[0]?.message ?? parsed.error);
    return null;
  }
  return { id, ...parsed.data };
}

function parseProduct(raw: ProductDoc): ProductDoc | null {
  const { id, ...data } = raw;
  // Postgres returns timestamptz; normalise to ISO string for zod.
  const normalised = {
    ...data,
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : new Date(data.createdAt as unknown as string).toISOString(),
    updatedAt:
      typeof data.updatedAt === "string"
        ? data.updatedAt
        : new Date(data.updatedAt as unknown as string).toISOString(),
  };
  const parsed = productSchema.safeParse(normalised);
  if (!parsed.success) {
    logBad("products", id, parsed.error.issues[0]?.message ?? parsed.error);
    return null;
  }
  return { id, ...parsed.data };
}

function parseVariant(raw: VariantDoc): VariantDoc | null {
  const { id, ...data } = raw;
  const parsed = variantSchema.safeParse(data);
  if (!parsed.success) {
    logBad("variants", id, parsed.error.issues[0]?.message ?? parsed.error);
    return null;
  }
  return { id, ...parsed.data };
}

function normalizeSearchToken(q: string): string {
  return q
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 15);
}

async function loadVariants(productId: string): Promise<VariantDoc[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("variants")
    .select("*")
    .eq("product_id", productId);
  if (error) throw error;
  const out: VariantDoc[] = [];
  for (const row of data ?? []) {
    const v = parseVariant(variantFromRow(row as Record<string, unknown>));
    if (v) out.push(v);
  }
  return out;
}

export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("categories")
    .select("*")
    .eq("is_active", true);
  if (error) throw error;
  const all: CategoryDoc[] = [];
  for (const row of data ?? []) {
    const cat = parseCategory(categoryFromRow(row as Record<string, unknown>));
    if (cat) all.push(cat);
  }
  all.sort((a, b) => a.order - b.order);
  const roots = all.filter((c) => c.parentId == null);
  return roots.map((root) => ({
    ...root,
    children: all
      .filter((c) => c.parentId === root.id)
      .sort((a, b) => a.order - b.order),
  }));
}

export async function getCategoryBySlug(slug: string): Promise<CategoryDoc | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return parseCategory(categoryFromRow(data as Record<string, unknown>));
}

export async function getBrandBySlug(slug: string): Promise<BrandDoc | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return parseBrand(brandFromRow(data as Record<string, unknown>));
}

export async function getBrandById(id: string): Promise<BrandDoc | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("brands")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const brand = parseBrand(brandFromRow(data as Record<string, unknown>));
  if (!brand || !brand.isActive) return null;
  return brand;
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithVariants | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const product = parseProduct(productFromRow(data as Record<string, unknown>));
  if (!product) return null;
  const variants = await loadVariants(product.id);
  return { ...product, variants };
}

async function categoryScopeIds(categoryId: string): Promise<string[]> {
  const admin = getSupabaseAdmin();
  const ids = [categoryId];
  const { data, error } = await admin
    .from("categories")
    .select("id")
    .eq("parent_id", categoryId)
    .eq("is_active", true)
    .limit(29);
  if (error) throw error;
  for (const row of data ?? []) {
    ids.push(String((row as { id: string }).id));
  }
  return ids.slice(0, 30);
}

function sortProducts(items: ProductDoc[], sort: ProductSort): ProductDoc[] {
  const copy = [...items];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.minPriceCents - b.minPriceCents);
    case "price-desc":
      return copy.sort((a, b) => b.minPriceCents - a.minPriceCents);
    case "best-sellers":
      return copy
        .filter((p) => p.isBestSeller)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "newest":
    default:
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export async function listProducts(input: ListProductsInput = {}): Promise<{
  items: ProductDoc[];
  page: number;
  pageSize: number;
  total: number;
}> {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, input.pageSize ?? 12));
  const sort: ProductSort = input.sort ?? "newest";
  const admin = getSupabaseAdmin();

  let query = admin.from("products").select("*").eq("status", "active");

  if (input.categoryId) {
    const ids = await categoryScopeIds(input.categoryId);
    query = query.overlaps("category_ids", ids);
  } else if (input.brandId) {
    query = query.eq("brand_id", input.brandId);
  }

  const { data, error } = await query;
  if (error) throw error;

  let items: ProductDoc[] = [];
  for (const row of data ?? []) {
    const product = parseProduct(productFromRow(row as Record<string, unknown>));
    if (product) items.push(product);
  }
  items = sortProducts(items, sort);

  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
  };
}

export async function searchProducts(q: string, limit = 8): Promise<ProductDoc[]> {
  const token = normalizeSearchToken(q);
  if (token.length < 2) return [];
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("products")
    .select("*")
    .eq("status", "active")
    .contains("search_tokens", [token])
    .limit(Math.min(50, Math.max(1, limit)));
  if (error) throw error;
  const items: ProductDoc[] = [];
  for (const row of data ?? []) {
    const product = parseProduct(productFromRow(row as Record<string, unknown>));
    if (product) items.push(product);
  }
  return items;
}

export async function getRelated(
  product: ProductDoc,
  limit = 8,
): Promise<ProductDoc[]> {
  const max = Math.min(8, Math.max(1, limit));
  const seen = new Set<string>([product.id]);
  const out: ProductDoc[] = [];
  const admin = getSupabaseAdmin();

  for (const id of product.relatedIds) {
    if (out.length >= max) break;
    if (seen.has(id)) continue;
    const { data, error } = await admin
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) continue;
    const parsed = parseProduct(productFromRow(data as Record<string, unknown>));
    if (!parsed || parsed.status !== "active") continue;
    seen.add(parsed.id);
    out.push(parsed);
  }

  if (out.length < max && product.categoryIds[0]) {
    const { items } = await listProducts({
      categoryId: product.categoryIds[0],
      page: 1,
      pageSize: max + 4,
      sort: "newest",
    });
    for (const item of items) {
      if (out.length >= max) break;
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
  }

  return out;
}

export async function getBestSellers(n = 8): Promise<ProductDoc[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("products")
    .select("*")
    .eq("status", "active")
    .eq("is_best_seller", true)
    .order("created_at", { ascending: false })
    .limit(Math.min(24, Math.max(1, n)));
  if (error) throw error;
  const items: ProductDoc[] = [];
  for (const row of data ?? []) {
    const product = parseProduct(productFromRow(row as Record<string, unknown>));
    if (product) items.push(product);
  }
  return items;
}

export async function getNewProducts(n = 8): Promise<ProductDoc[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("products")
    .select("*")
    .eq("status", "active")
    .eq("is_new", true)
    .order("created_at", { ascending: false })
    .limit(Math.min(24, Math.max(1, n)));
  if (error) throw error;
  const items: ProductDoc[] = [];
  for (const row of data ?? []) {
    const product = parseProduct(productFromRow(row as Record<string, unknown>));
    if (product) items.push(product);
  }
  return items;
}

export async function getOffers(n = 8): Promise<ProductDoc[]> {
  const { items } = await listProducts({ page: 1, pageSize: 48, sort: "newest" });
  const offers: ProductDoc[] = [];
  for (const product of items) {
    if (offers.length >= n) break;
    const variants = await loadVariants(product.id);
    const onSale = variants.some(
      (v) =>
        typeof v.compareAtCents === "number" && v.compareAtCents > v.priceCents,
    );
    if (onSale) offers.push(product);
  }
  return offers;
}

/** Used by cart/order paths. */
export async function getProductById(id: string): Promise<ProductDoc | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return parseProduct(productFromRow(data as Record<string, unknown>));
}

export async function getVariant(
  productId: string,
  variantId: string,
): Promise<VariantDoc | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("variants")
    .select("*")
    .eq("product_id", productId)
    .eq("id", variantId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return parseVariant(variantFromRow(data as Record<string, unknown>));
}

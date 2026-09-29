import "server-only";
import type { Query } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
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

function parseCategory(id: string, data: unknown): CategoryDoc | null {
  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) {
    logBad("categories", id, parsed.error.issues[0]?.message ?? parsed.error);
    return null;
  }
  return { id, ...parsed.data };
}

function parseBrand(id: string, data: unknown): BrandDoc | null {
  const parsed = brandSchema.safeParse(data);
  if (!parsed.success) {
    logBad("brands", id, parsed.error.issues[0]?.message ?? parsed.error);
    return null;
  }
  return { id, ...parsed.data };
}

function parseProduct(id: string, data: unknown): ProductDoc | null {
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    logBad("products", id, parsed.error.issues[0]?.message ?? parsed.error);
    return null;
  }
  return { id, ...parsed.data };
}

function parseVariant(id: string, data: unknown): VariantDoc | null {
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
  const snap = await db.collection("products").doc(productId).collection("variants").get();
  const out: VariantDoc[] = [];
  for (const doc of snap.docs) {
    const v = parseVariant(doc.id, doc.data());
    if (v) out.push(v);
  }
  return out;
}

export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
  const snap = await db.collection("categories").where("isActive", "==", true).get();
  const all: CategoryDoc[] = [];
  for (const doc of snap.docs) {
    const cat = parseCategory(doc.id, doc.data());
    if (cat) all.push(cat);
  }
  all.sort((a, b) => a.order - b.order);
  const roots = all.filter((c) => c.parentId == null);
  return roots.map((root) => ({
    ...root,
    children: all.filter((c) => c.parentId === root.id).sort((a, b) => a.order - b.order),
  }));
}

export async function getCategoryBySlug(slug: string): Promise<CategoryDoc | null> {
  const snap = await db
    .collection("categories")
    .where("slug", "==", slug)
    .where("isActive", "==", true)
    .limit(1)
    .get();
  const doc = snap.docs[0];
  if (!doc) return null;
  return parseCategory(doc.id, doc.data());
}

export async function getBrandBySlug(slug: string): Promise<BrandDoc | null> {
  const snap = await db
    .collection("brands")
    .where("slug", "==", slug)
    .where("isActive", "==", true)
    .limit(1)
    .get();
  const doc = snap.docs[0];
  if (!doc) return null;
  return parseBrand(doc.id, doc.data());
}

export async function getBrandById(id: string): Promise<BrandDoc | null> {
  const snap = await db.collection("brands").doc(id).get();
  if (!snap.exists) return null;
  const brand = parseBrand(snap.id, snap.data());
  if (!brand || !brand.isActive) return null;
  return brand;
}

export async function getProductBySlug(slug: string): Promise<ProductWithVariants | null> {
  const snap = await db
    .collection("products")
    .where("slug", "==", slug)
    .where("status", "==", "active")
    .limit(1)
    .get();
  const doc = snap.docs[0];
  if (!doc) return null;
  const product = parseProduct(doc.id, doc.data());
  if (!product) return null;
  const variants = await loadVariants(doc.id);
  return { ...product, variants };
}

async function categoryScopeIds(categoryId: string): Promise<string[]> {
  const ids = [categoryId];
  const children = await db
    .collection("categories")
    .where("parentId", "==", categoryId)
    .where("isActive", "==", true)
    .get();
  for (const doc of children.docs) {
    if (ids.length >= 30) break;
    ids.push(doc.id);
  }
  return ids.slice(0, 30);
}

function applySort(query: Query, sort: ProductSort): Query {
  switch (sort) {
    case "price-asc":
      return query.orderBy("minPriceCents", "asc");
    case "price-desc":
      return query.orderBy("minPriceCents", "desc");
    case "best-sellers":
      return query.where("isBestSeller", "==", true).orderBy("createdAt", "desc");
    case "newest":
    default:
      return query.orderBy("createdAt", "desc");
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

  let query: Query = db.collection("products").where("status", "==", "active");

  if (input.categoryId) {
    const ids = await categoryScopeIds(input.categoryId);
    query = query.where("categoryIds", "array-contains-any", ids);
  } else if (input.brandId) {
    query = query.where("brandId", "==", input.brandId);
  }

  query = applySort(query, sort);

  const snap = await query.get();
  const items: ProductDoc[] = [];
  for (const doc of snap.docs) {
    const product = parseProduct(doc.id, doc.data());
    if (product) items.push(product);
  }

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

  const snap = await db
    .collection("products")
    .where("status", "==", "active")
    .where("searchTokens", "array-contains", token)
    .limit(Math.min(50, Math.max(1, limit)))
    .get();

  const items: ProductDoc[] = [];
  for (const doc of snap.docs) {
    const product = parseProduct(doc.id, doc.data());
    if (product) items.push(product);
  }
  return items;
}

export async function getRelated(product: ProductDoc, limit = 8): Promise<ProductDoc[]> {
  const max = Math.min(8, Math.max(1, limit));
  const seen = new Set<string>([product.id]);
  const out: ProductDoc[] = [];

  for (const id of product.relatedIds) {
    if (out.length >= max) break;
    if (seen.has(id)) continue;
    const snap = await db.collection("products").doc(id).get();
    if (!snap.exists) continue;
    const parsed = parseProduct(snap.id, snap.data());
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
  const snap = await db
    .collection("products")
    .where("status", "==", "active")
    .where("isBestSeller", "==", true)
    .orderBy("createdAt", "desc")
    .limit(Math.min(24, Math.max(1, n)))
    .get();
  const items: ProductDoc[] = [];
  for (const doc of snap.docs) {
    const product = parseProduct(doc.id, doc.data());
    if (product) items.push(product);
  }
  return items;
}

export async function getNewProducts(n = 8): Promise<ProductDoc[]> {
  const snap = await db
    .collection("products")
    .where("status", "==", "active")
    .where("isNew", "==", true)
    .orderBy("createdAt", "desc")
    .limit(Math.min(24, Math.max(1, n)))
    .get();
  const items: ProductDoc[] = [];
  for (const doc of snap.docs) {
    const product = parseProduct(doc.id, doc.data());
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
        typeof v.compareAtCents === "number" &&
        v.compareAtCents > v.priceCents,
    );
    if (onSale) offers.push(product);
  }
  return offers;
}

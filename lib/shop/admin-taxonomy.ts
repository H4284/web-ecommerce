import "server-only";
import { updateTag } from "next/cache";
import { db } from "@/lib/firebase/admin";
import { adminAction } from "@/lib/shop/admin";
import { requireAdmin } from "@/lib/shop/auth";
import {
  archiveBrandInputSchema,
  archiveCategoryInputSchema,
  deleteBrandInputSchema,
  deleteCategoryInputSchema,
  moveCategoryInputSchema,
  saveBrandInputSchema,
  saveCategoryInputSchema,
  type MoveCategoryInput,
  type SaveBrandInput,
  type SaveCategoryInput,
} from "@/lib/shop/admin-taxonomy-schema";
import {
  brandSchema,
  categorySchema,
  type Brand,
  type Category,
} from "@/lib/shop/schemas";

export class TaxonomyInUseError extends Error {
  constructor(kind: "category" | "brand") {
    super(`${kind}_in_use`);
    this.name = "TaxonomyInUseError";
  }
}

export type AdminCategory = Category & { id: string; productCount: number };
export type AdminBrand = Brand & { id: string; productCount: number };

export async function listAdminTaxonomyCategories(): Promise<AdminCategory[]> {
  await requireAdmin();
  const [cats, products] = await Promise.all([
    db.collection("categories").get(),
    db.collection("products").select("categoryIds").get(),
  ]);

  const counts = new Map<string, number>();
  for (const doc of products.docs) {
    const ids = (doc.data().categoryIds as string[] | undefined) ?? [];
    for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const items: AdminCategory[] = [];
  for (const doc of cats.docs) {
    const parsed = categorySchema.safeParse(doc.data());
    if (!parsed.success) continue;
    items.push({
      id: doc.id,
      ...parsed.data,
      productCount: counts.get(doc.id) ?? 0,
    });
  }
  return items.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function listAdminTaxonomyBrands(): Promise<AdminBrand[]> {
  await requireAdmin();
  const [brands, products] = await Promise.all([
    db.collection("brands").get(),
    db.collection("products").select("brandId").get(),
  ]);

  const counts = new Map<string, number>();
  for (const doc of products.docs) {
    const id = doc.data().brandId as string | null | undefined;
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const items: AdminBrand[] = [];
  for (const doc of brands.docs) {
    const parsed = brandSchema.safeParse(doc.data());
    if (!parsed.success) continue;
    items.push({
      id: doc.id,
      ...parsed.data,
      productCount: counts.get(doc.id) ?? 0,
    });
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveAdminCategory(input: unknown) {
  return adminAction({
    schema: saveCategoryInputSchema,
    action: "category.save",
    target: (d) => `categories/${d.id ?? d.slug}`,
    input,
    fn: async (data) => writeCategory(data),
  });
}

export async function moveAdminCategory(input: unknown) {
  return adminAction({
    schema: moveCategoryInputSchema,
    action: "category.move",
    target: (d) => `categories/${d.id}`,
    input,
    fn: async (data) => moveCategory(data),
  });
}

export async function archiveAdminCategory(input: unknown) {
  return adminAction({
    schema: archiveCategoryInputSchema,
    action: "category.archive",
    target: (d) => `categories/${d.id}`,
    input,
    fn: async (data) => {
      await db.collection("categories").doc(data.id).set(
        { isActive: false },
        { merge: true },
      );
      updateTag("catalog");
      return { id: data.id };
    },
  });
}

export async function deleteAdminCategory(input: unknown) {
  return adminAction({
    schema: deleteCategoryInputSchema,
    action: "category.delete",
    target: (d) => `categories/${d.id}`,
    input,
    fn: async (data) => {
      const used = await categoryProductCount(data.id);
      if (used > 0) throw new TaxonomyInUseError("category");
      await db.collection("categories").doc(data.id).delete();
      updateTag("catalog");
      return { id: data.id };
    },
  });
}

export async function saveAdminBrand(input: unknown) {
  return adminAction({
    schema: saveBrandInputSchema,
    action: "brand.save",
    target: (d) => `brands/${d.id ?? d.slug}`,
    input,
    fn: async (data) => writeBrand(data),
  });
}

export async function archiveAdminBrand(input: unknown) {
  return adminAction({
    schema: archiveBrandInputSchema,
    action: "brand.archive",
    target: (d) => `brands/${d.id}`,
    input,
    fn: async (data) => {
      await db.collection("brands").doc(data.id).set(
        { isActive: false },
        { merge: true },
      );
      updateTag("catalog");
      return { id: data.id };
    },
  });
}

export async function deleteAdminBrand(input: unknown) {
  return adminAction({
    schema: deleteBrandInputSchema,
    action: "brand.delete",
    target: (d) => `brands/${d.id}`,
    input,
    fn: async (data) => {
      const used = await brandProductCount(data.id);
      if (used > 0) throw new TaxonomyInUseError("brand");
      await db.collection("brands").doc(data.id).delete();
      updateTag("catalog");
      return { id: data.id };
    },
  });
}

async function categoryProductCount(categoryId: string): Promise<number> {
  const snap = await db
    .collection("products")
    .where("categoryIds", "array-contains", categoryId)
    .limit(1)
    .get();
  return snap.size;
}

async function brandProductCount(brandId: string): Promise<number> {
  const snap = await db
    .collection("products")
    .where("brandId", "==", brandId)
    .limit(1)
    .get();
  return snap.size;
}

async function writeCategory(data: SaveCategoryInput): Promise<{ id: string }> {
  const id = data.id ?? db.collection("categories").doc().id;
  const doc = categorySchema.parse({
    name: data.name,
    slug: data.slug,
    parentId: data.parentId,
    order: data.order,
    isActive: data.isActive,
    image: data.image ?? null,
    ...(data.seoTitle || data.seoDescription
      ? {
          seo: {
            ...(data.seoTitle ? { title: data.seoTitle } : {}),
            ...(data.seoDescription ? { description: data.seoDescription } : {}),
          },
        }
      : {}),
  });
  await db.collection("categories").doc(id).set(doc, { merge: true });
  updateTag("catalog");
  return { id };
}

async function writeBrand(data: SaveBrandInput): Promise<{ id: string }> {
  const id = data.id ?? db.collection("brands").doc().id;
  const doc = brandSchema.parse({
    name: data.name,
    slug: data.slug,
    logo: data.logo ?? null,
    description: data.description,
    isActive: data.isActive,
    ...(data.seoTitle || data.seoDescription
      ? {
          seo: {
            ...(data.seoTitle ? { title: data.seoTitle } : {}),
            ...(data.seoDescription ? { description: data.seoDescription } : {}),
          },
        }
      : {}),
  });
  await db.collection("brands").doc(id).set(doc, { merge: true });
  updateTag("catalog");
  return { id };
}

async function moveCategory(data: MoveCategoryInput): Promise<{ id: string }> {
  const ref = db.collection("categories").doc(data.id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Category not found");
  const current = categorySchema.parse(snap.data());

  const siblingsSnap = await db.collection("categories").get();
  const siblings = siblingsSnap.docs
    .map((d) => {
      const parsed = categorySchema.safeParse(d.data());
      if (!parsed.success) return null;
      if ((parsed.data.parentId ?? null) !== (current.parentId ?? null)) return null;
      return { id: d.id, ...parsed.data };
    })
    .filter((x): x is Category & { id: string } => Boolean(x))
    .sort((a, b) => a.order - b.order);

  const index = siblings.findIndex((s) => s.id === data.id);
  if (index < 0) throw new Error("Category not found among siblings");
  const swapWith =
    data.direction === "up" ? siblings[index - 1] : siblings[index + 1];
  if (!swapWith) return { id: data.id };

  const batch = db.batch();
  batch.set(ref, { order: swapWith.order }, { merge: true });
  batch.set(
    db.collection("categories").doc(swapWith.id),
    { order: current.order },
    { merge: true },
  );
  await batch.commit();
  updateTag("catalog");
  return { id: data.id };
}

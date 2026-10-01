import "server-only";
import { updateTag } from "next/cache";
import { randomBytes } from "node:crypto";
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
import {
  brandFromRow,
  brandToRow,
  categoryFromRow,
  categoryToRow,
} from "@/lib/shop/supabase-mappers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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
  const admin = getSupabaseAdmin();
  const [{ data: cats, error: cErr }, { data: products, error: pErr }] =
    await Promise.all([
      admin.from("categories").select("*"),
      admin.from("products").select("category_ids"),
    ]);
  if (cErr) throw cErr;
  if (pErr) throw pErr;

  const counts = new Map<string, number>();
  for (const row of products ?? []) {
    const ids = (row.category_ids as string[] | null) ?? [];
    for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const items: AdminCategory[] = [];
  for (const row of cats ?? []) {
    const parsed = categoryFromRow(row as Record<string, unknown>);
    items.push({
      ...parsed,
      productCount: counts.get(parsed.id) ?? 0,
    });
  }
  return items.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function listAdminTaxonomyBrands(): Promise<AdminBrand[]> {
  await requireAdmin();
  const admin = getSupabaseAdmin();
  const [{ data: brands, error: bErr }, { data: products, error: pErr }] =
    await Promise.all([
      admin.from("brands").select("*"),
      admin.from("products").select("brand_id"),
    ]);
  if (bErr) throw bErr;
  if (pErr) throw pErr;

  const counts = new Map<string, number>();
  for (const row of products ?? []) {
    const id = row.brand_id as string | null;
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const items: AdminBrand[] = [];
  for (const row of brands ?? []) {
    const parsed = brandFromRow(row as Record<string, unknown>);
    items.push({
      ...parsed,
      productCount: counts.get(parsed.id) ?? 0,
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
      const admin = getSupabaseAdmin();
      const { error } = await admin
        .from("categories")
        .update({ is_active: false })
        .eq("id", data.id);
      if (error) throw error;
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
      const admin = getSupabaseAdmin();
      const { error } = await admin.from("categories").delete().eq("id", data.id);
      if (error) throw error;
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
      const admin = getSupabaseAdmin();
      const { error } = await admin
        .from("brands")
        .update({ is_active: false })
        .eq("id", data.id);
      if (error) throw error;
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
      const admin = getSupabaseAdmin();
      const { error } = await admin.from("brands").delete().eq("id", data.id);
      if (error) throw error;
      updateTag("catalog");
      return { id: data.id };
    },
  });
}

async function categoryProductCount(categoryId: string): Promise<number> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("products")
    .select("id")
    .contains("category_ids", [categoryId])
    .limit(1);
  if (error) throw error;
  return data?.length ?? 0;
}

async function brandProductCount(brandId: string): Promise<number> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("products")
    .select("id")
    .eq("brand_id", brandId)
    .limit(1);
  if (error) throw error;
  return data?.length ?? 0;
}

async function writeCategory(data: SaveCategoryInput): Promise<{ id: string }> {
  const id = data.id ?? randomBytes(8).toString("hex");
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
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("categories")
    .upsert(categoryToRow({ id, ...doc }));
  if (error) throw error;
  updateTag("catalog");
  return { id };
}

async function writeBrand(data: SaveBrandInput): Promise<{ id: string }> {
  const id = data.id ?? randomBytes(8).toString("hex");
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
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("brands").upsert(brandToRow({ id, ...doc }));
  if (error) throw error;
  updateTag("catalog");
  return { id };
}

async function moveCategory(data: MoveCategoryInput): Promise<{ id: string }> {
  const admin = getSupabaseAdmin();
  const { data: row, error } = await admin
    .from("categories")
    .select("*")
    .eq("id", data.id)
    .maybeSingle();
  if (error) throw error;
  if (!row) throw new Error("Category not found");
  const current = categoryFromRow(row as Record<string, unknown>);

  const { data: all, error: aErr } = await admin.from("categories").select("*");
  if (aErr) throw aErr;

  const siblings = (all ?? [])
    .map((r) => categoryFromRow(r as Record<string, unknown>))
    .filter((c) => (c.parentId ?? null) === (current.parentId ?? null))
    .sort((a, b) => a.order - b.order);

  const index = siblings.findIndex((s) => s.id === data.id);
  if (index < 0) throw new Error("Category not found among siblings");
  const swapWith =
    data.direction === "up" ? siblings[index - 1] : siblings[index + 1];
  if (!swapWith) return { id: data.id };

  const { error: e1 } = await admin
    .from("categories")
    .update({ order: swapWith.order })
    .eq("id", data.id);
  if (e1) throw e1;
  const { error: e2 } = await admin
    .from("categories")
    .update({ order: current.order })
    .eq("id", swapWith.id);
  if (e2) throw e2;

  updateTag("catalog");
  return { id: data.id };
}

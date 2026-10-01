import type {
  Brand,
  Category,
  Product,
  Variant,
} from "@/lib/shop/schemas";

/** Map Postgres snake_case rows → catalog zod shapes (camelCase). */

export function categoryFromRow(row: Record<string, unknown>): Category & { id: string } {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    parentId: (row.parent_id as string | null) ?? null,
    order: Number(row.order),
    isActive: Boolean(row.is_active),
    image: (row.image as Category["image"]) ?? null,
    seo: (row.seo as Category["seo"]) ?? undefined,
  };
}

export function brandFromRow(row: Record<string, unknown>): Brand & { id: string } {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    logo: (row.logo as Brand["logo"]) ?? null,
    description: row.description != null ? String(row.description) : undefined,
    isActive: Boolean(row.is_active),
    seo: (row.seo as Brand["seo"]) ?? undefined,
  };
}

export function productFromRow(row: Record<string, unknown>): Product & { id: string } {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    brandId: (row.brand_id as string | null) ?? null,
    categoryIds: (row.category_ids as string[]) ?? [],
    shortDescription: String(row.short_description ?? ""),
    description: String(row.description ?? ""),
    images: (row.images as Product["images"]) ?? [],
    options: (row.options as Product["options"]) ?? [],
    status: row.status as Product["status"],
    isNew: Boolean(row.is_new),
    isBestSeller: Boolean(row.is_best_seller),
    unit: (row.unit as Product["unit"]) ?? null,
    relatedIds: (row.related_ids as string[]) ?? [],
    searchTokens: (row.search_tokens as string[]) ?? [],
    minPriceCents: Number(row.min_price_cents ?? 0),
    maxPriceCents: Number(row.max_price_cents ?? 0),
    totalStock: Number(row.total_stock ?? 0),
    defaultVariantId: (row.default_variant_id as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    seo: (row.seo as Product["seo"]) ?? undefined,
  };
}

export function variantFromRow(row: Record<string, unknown>): Variant & { id: string } {
  return {
    id: String(row.id),
    sku: String(row.sku),
    optionValues: (row.option_values as Variant["optionValues"]) ?? {},
    priceCents: Number(row.price_cents),
    compareAtCents:
      row.compare_at_cents == null ? null : Number(row.compare_at_cents),
    stock: Number(row.stock),
    isDefault: Boolean(row.is_default),
    image: (row.image as Variant["image"]) ?? null,
  };
}

export function categoryToRow(cat: Category & { id: string }) {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    parent_id: cat.parentId,
    order: cat.order,
    is_active: cat.isActive,
    image: cat.image ?? null,
    seo: cat.seo ?? null,
  };
}

export function brandToRow(brand: Brand & { id: string }) {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logo: brand.logo ?? null,
    description: brand.description ?? null,
    is_active: brand.isActive,
    seo: brand.seo ?? null,
  };
}

export function productToRow(product: Product & { id: string }) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand_id: product.brandId,
    category_ids: product.categoryIds,
    short_description: product.shortDescription,
    description: product.description,
    images: product.images,
    options: product.options,
    status: product.status,
    is_new: product.isNew,
    is_best_seller: product.isBestSeller,
    unit: product.unit ?? null,
    related_ids: product.relatedIds,
    search_tokens: product.searchTokens,
    min_price_cents: product.minPriceCents,
    max_price_cents: product.maxPriceCents,
    total_stock: product.totalStock,
    default_variant_id: product.defaultVariantId,
    seo: product.seo ?? null,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  };
}

export function variantToRow(
  productId: string,
  variant: Variant & { id: string },
) {
  return {
    id: variant.id,
    product_id: productId,
    sku: variant.sku,
    option_values: variant.optionValues,
    price_cents: variant.priceCents,
    compare_at_cents: variant.compareAtCents ?? null,
    stock: variant.stock,
    is_default: variant.isDefault,
    image: variant.image ?? null,
  };
}

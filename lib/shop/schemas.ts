import { z } from "zod";

const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase a-z 0-9 with hyphens");

const seoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

const imageRefSchema = z.object({
  path: z.string().min(1),
  alt: z.string(),
});

export const categorySchema = z.object({
  name: z.string().min(1),
  slug: slugSchema,
  parentId: z.string().nullable(),
  order: z.number().int(),
  isActive: z.boolean(),
  image: imageRefSchema.nullable().optional(),
  seo: seoSchema.optional(),
});

export const brandSchema = z.object({
  name: z.string().min(1),
  slug: slugSchema,
  logo: imageRefSchema.nullable().optional(),
  isActive: z.boolean(),
  seo: seoSchema.optional(),
});

const productOptionSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.string().min(1)).min(1),
});

const productUnitSchema = z.object({
  amount: z.number().positive(),
  label: z.string().min(1),
});

export const productSchema = z.object({
  name: z.string().min(1),
  slug: slugSchema,
  brandId: z.string().nullable(),
  categoryIds: z.array(z.string().min(1)).min(1),
  shortDescription: z.string(),
  description: z.string(),
  images: z.array(imageRefSchema).min(1),
  options: z.array(productOptionSchema).max(2),
  status: z.enum(["draft", "active", "archived"]),
  isNew: z.boolean(),
  isBestSeller: z.boolean(),
  unit: productUnitSchema.nullable().optional(),
  relatedIds: z.array(z.string()),
  searchTokens: z.array(z.string()),
  minPriceCents: z.number().int().nonnegative(),
  maxPriceCents: z.number().int().nonnegative(),
  totalStock: z.number().int().nonnegative(),
  defaultVariantId: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const variantSchema = z.object({
  sku: z.string().min(1),
  optionValues: z.record(z.string(), z.string()),
  priceCents: z.number().int().nonnegative(),
  compareAtCents: z.number().int().nonnegative().nullable().optional(),
  stock: z.number().int().nonnegative(),
  isDefault: z.boolean(),
  image: imageRefSchema.nullable().optional(),
});

export type Category = z.infer<typeof categorySchema>;
export type Brand = z.infer<typeof brandSchema>;
export type Product = z.infer<typeof productSchema>;
export type Variant = z.infer<typeof variantSchema>;
export type ProductOption = z.infer<typeof productOptionSchema>;
export type ProductUnit = z.infer<typeof productUnitSchema>;
export type ImageRef = z.infer<typeof imageRefSchema>;
export type Seo = z.infer<typeof seoSchema>;

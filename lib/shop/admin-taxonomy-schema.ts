import { z } from "zod";

const imageRefSchema = z
  .object({
    path: z.string().min(1),
    alt: z.string(),
  })
  .nullable();

export const saveCategoryInputSchema = z.object({
  id: z.string().min(1).nullable(),
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  parentId: z.string().min(1).nullable(),
  order: z.number().int(),
  isActive: z.boolean(),
  image: imageRefSchema.optional(),
  seoTitle: z.string(),
  seoDescription: z.string(),
});

export type SaveCategoryInput = z.infer<typeof saveCategoryInputSchema>;

export const moveCategoryInputSchema = z.object({
  id: z.string().min(1),
  direction: z.enum(["up", "down"]),
});

export type MoveCategoryInput = z.infer<typeof moveCategoryInputSchema>;

export const archiveCategoryInputSchema = z.object({
  id: z.string().min(1),
});

export const deleteCategoryInputSchema = z.object({
  id: z.string().min(1),
});

export const saveBrandInputSchema = z.object({
  id: z.string().min(1).nullable(),
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string(),
  isActive: z.boolean(),
  logo: imageRefSchema.optional(),
  seoTitle: z.string(),
  seoDescription: z.string(),
});

export type SaveBrandInput = z.infer<typeof saveBrandInputSchema>;

export const archiveBrandInputSchema = z.object({
  id: z.string().min(1),
});

export const deleteBrandInputSchema = z.object({
  id: z.string().min(1),
});

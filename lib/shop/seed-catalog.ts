import type { Brand, Category, Product, Variant } from "@/lib/shop/schemas";
import { slugify } from "@/lib/shop/slug";

export const SEED_WIDTHS = [320, 640, 960, 1280] as const;

export const SEED_CATEGORY_IDS = ["perfumes", "women", "men", "unisex"] as const;
export const SEED_BRAND_ID = "sanem";
export const SEED_PRODUCT_COUNT = 20;
export const SEED_DUAL_AXIS_COUNT = 5;

type SeedProduct = {
  id: string;
  color: string;
  imageAlt: string;
  product: Omit<
    Product,
    | "searchTokens"
    | "minPriceCents"
    | "maxPriceCents"
    | "totalStock"
    | "defaultVariantId"
    | "images"
  >;
  variants: Array<Variant & { id: string }>;
};

const stamp = "2026-09-29T12:00:00.000Z";

export function buildSeedCategories(): Array<Category & { id: string }> {
  return [
    {
      id: "perfumes",
      name: "Perfumes",
      slug: "perfumes",
      parentId: null,
      order: 0,
      isActive: true,
      image: null,
      seo: { title: "Perfumes" },
    },
    {
      id: "women",
      name: "Women",
      slug: "women",
      parentId: "perfumes",
      order: 1,
      isActive: true,
      image: null,
      seo: { title: "Women" },
    },
    {
      id: "men",
      name: "Men",
      slug: "men",
      parentId: "perfumes",
      order: 2,
      isActive: true,
      image: null,
      seo: { title: "Men" },
    },
    {
      id: "unisex",
      name: "Unisex",
      slug: "unisex",
      parentId: "perfumes",
      order: 3,
      isActive: true,
      image: null,
      seo: { title: "Unisex" },
    },
  ];
}

export function buildSeedBrand(): Brand & { id: string } {
  return {
    id: SEED_BRAND_ID,
    name: "Sanem",
    slug: "sanem",
    logo: null,
    isActive: true,
    seo: { title: "Sanem" },
  };
}

const NAMES = [
  "Qelibar",
  "Vesë",
  "Kedër",
  "Trëndafil",
  "Misk",
  "Bergamotë",
  "Iris",
  "Oud",
  "Vetiver",
  "Ambra",
  "Jasemin",
  "Patchouli",
  "Shafran",
  "Vanilë",
  "Luleqielli",
  "Timian",
  "Qershi",
  "Dru i Zi",
  "Mjaltë",
  "Kripë Deti",
] as const;

const COLORS = [
  "#6d5a3d",
  "#3d4a5c",
  "#5c3d4a",
  "#4a5c3d",
  "#3d5c58",
  "#5c4a3d",
  "#4a3d5c",
  "#3d465c",
  "#5c3d3d",
  "#3d5c4a",
  "#4a4a5c",
  "#5c5a3d",
  "#3d3d5c",
  "#5c463d",
  "#465c3d",
  "#3d5c5c",
  "#5c3d55",
  "#3d4a3d",
  "#4a3d45",
  "#555a3d",
];

function sizeVariants(basePrice: number, stock: number[], compareAt?: number | null) {
  const sizes = ["50 ml", "100 ml"] as const;
  return sizes.map((size, i) => ({
    id: size === "50 ml" ? "50ml" : "100ml",
    sku: "",
    optionValues: { size },
    priceCents: basePrice + i * 2800,
    compareAtCents: compareAt != null ? compareAt + i * 2800 : null,
    stock: stock[i] ?? 0,
    isDefault: i === 0,
    image: null,
  }));
}

function dualAxisVariants(basePrice: number) {
  const sizes = ["50 ml", "100 ml"] as const;
  const concentrations = ["EDP", "Extrait"] as const;
  const out: Array<Variant & { id: string }> = [];
  let n = 0;
  for (const size of sizes) {
    for (const concentration of concentrations) {
      const id = `${size === "50 ml" ? "50" : "100"}-${concentration.toLowerCase()}`;
      out.push({
        id,
        sku: "",
        optionValues: { size, concentration },
        priceCents: basePrice + n * 1500,
        compareAtCents: n === 0 ? basePrice + 2000 : null,
        stock: n === 3 ? 0 : 4 + n,
        isDefault: n === 0,
        image: null,
      });
      n += 1;
    }
  }
  return out;
}

/** Fixed Sanem-shaped catalog: 4 categories, 1 brand, 20 products (5 with two axes). */
export function buildSeedProducts(): SeedProduct[] {
  const categoryCycle = ["women", "men", "unisex"] as const;

  return NAMES.map((name, index) => {
    const id = `prod-${String(index + 1).padStart(2, "0")}`;
    const categoryId = categoryCycle[index % 3];
    const dual = index < SEED_DUAL_AXIS_COUNT;
    const basePrice = 4200 + index * 150;
    const variants = dual
      ? dualAxisVariants(basePrice)
      : sizeVariants(
          basePrice,
          index === 7 ? [0, 0] : index === 11 ? [0, 3] : [8, 5],
          index % 4 === 0 ? basePrice + 1200 : null,
        );

    for (const v of variants) {
      v.sku = `${id.toUpperCase()}-${v.id.toUpperCase()}`;
    }

    return {
      id,
      color: COLORS[index]!,
      imageAlt: `${name} bottle`,
      product: {
        name,
        slug: slugify(name),
        brandId: SEED_BRAND_ID,
        categoryIds: [categoryId],
        shortDescription: `A ${name} scent for every day.`,
        description: `## ${name}\nInvented seed fragrance for Sanem. Quiet luxury in a bottle.`,
        options: dual
          ? [
              { name: "size", values: ["50 ml", "100 ml"] },
              { name: "concentration", values: ["EDP", "Extrait"] },
            ]
          : [{ name: "size", values: ["50 ml", "100 ml"] }],
        status: index === 19 ? "archived" : index === 18 ? "draft" : "active",
        isNew: index < 3,
        isBestSeller: index === 4 || index === 9,
        unit: null,
        relatedIds: [],
        createdAt: stamp,
        updatedAt: stamp,
      },
      variants,
    };
  });
}

export function seedExpectedCounts() {
  const products = buildSeedProducts();
  return {
    categories: SEED_CATEGORY_IDS.length,
    brands: 1,
    products: products.length,
    dualAxis: products.filter((p) => p.product.options.length === 2).length,
    variants: products.reduce((n, p) => n + p.variants.length, 0),
  };
}

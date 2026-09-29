import { NextResponse } from "next/server";
import { z } from "zod";
import { searchProducts, getBrandById } from "@/lib/shop/catalog-queries";
import type { SearchApiHit } from "@/lib/shop/search-api";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  q: z.string().trim().min(2).max(50),
});

export type { SearchApiHit };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ q: searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Query must be 2–50 characters", results: [] as SearchApiHit[] },
      { status: 400 },
    );
  }

  const products = await searchProducts(parsed.data.q, 8);
  const brandIds = [
    ...new Set(products.map((p) => p.brandId).filter((id): id is string => Boolean(id))),
  ];
  const brands = new Map<string, string>();
  await Promise.all(
    brandIds.map(async (id) => {
      const brand = await getBrandById(id);
      if (brand) brands.set(id, brand.name);
    }),
  );

  const results: SearchApiHit[] = products.map((product) => ({
    slug: product.slug,
    name: product.name,
    brandName: product.brandId ? (brands.get(product.brandId) ?? null) : null,
    priceCents: product.minPriceCents,
    image: product.images[0]
      ? { path: product.images[0].path, alt: product.images[0].alt }
      : null,
  }));

  return NextResponse.json(
    { results },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}

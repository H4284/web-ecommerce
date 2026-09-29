import { setRemoteProject } from "./lib/remote";

async function main() {
  setRemoteProject(process.argv);

  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error("FIRESTORE_EMULATOR_HOST is empty — verify against the emulator");
  }

  const q = await import("@/lib/shop/catalog-queries");

  const tree = await q.getCategoryTree();
  console.log("getCategoryTree", {
    roots: tree.length,
    children: tree.reduce((n, r) => n + r.children.length, 0),
  });

  const women = await q.getCategoryBySlug("women");
  console.log("getCategoryBySlug(women)", women?.id ?? null);

  const brand = await q.getBrandBySlug("sanem");
  console.log("getBrandBySlug(sanem)", brand?.id ?? null);

  const listed = await q.listProducts({ categoryId: "perfumes", page: 1, pageSize: 12, sort: "newest" });
  console.log("listProducts(perfumes)", { total: listed.total, pageItems: listed.items.length });

  const byBrand = await q.listProducts({ brandId: "sanem", sort: "price-asc" });
  console.log("listProducts(brand sanem price-asc)", { total: byBrand.total });

  const found = await q.searchProducts("kreat", 8);
  console.log(
    "searchProducts(kreat)",
    found.map((p) => p.name),
  );
  if (!found.some((p) => p.name === "Kreatinë")) {
    throw new Error('search "kreat" did not find "Kreatinë"');
  }

  const product = await q.getProductBySlug("kreatine");
  console.log("getProductBySlug(kreatine)", {
    id: product?.id ?? null,
    variants: product?.variants.length ?? 0,
  });

  if (product) {
    const related = await q.getRelated(product, 8);
    console.log("getRelated", related.map((p) => p.slug));
  }

  const best = await q.getBestSellers(8);
  console.log("getBestSellers", best.length);

  const news = await q.getNewProducts(8);
  console.log("getNewProducts", news.length);

  const offers = await q.getOffers(8);
  console.log("getOffers", offers.length);

  const archived = await q.getProductBySlug(
    // last seed product when archived is prod-20 "Kripë Deti"
    "kripe-deti",
  );
  if (archived) {
    throw new Error("archived product must not appear via getProductBySlug");
  }
  console.log("archived hidden", true);

  const allActive = await q.listProducts({ pageSize: 48 });
  if (allActive.items.some((p) => p.status !== "active")) {
    throw new Error("listProducts returned a non-active product");
  }
  console.log("listProducts only active", true);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

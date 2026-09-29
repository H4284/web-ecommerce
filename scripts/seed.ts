import sharp from "sharp";
import { recomputeProduct } from "@/lib/shop/catalog-write";
import {
  brandSchema,
  categorySchema,
  productSchema,
  variantSchema,
} from "@/lib/shop/schemas";
import {
  SEED_WIDTHS,
  buildSeedBrand,
  buildSeedCategories,
  buildSeedProducts,
  seedExpectedCounts,
} from "@/lib/shop/seed-catalog";
import { setRemoteProject } from "./lib/remote";

async function writePlaceholderImages(productId: string, color: string) {
  const { getBucket } = await import("@/lib/firebase/admin");
  const bucket = getBucket();
  const base = color.replace("#", "");
  const r = Number.parseInt(base.slice(0, 2), 16);
  const g = Number.parseInt(base.slice(2, 4), 16);
  const b = Number.parseInt(base.slice(4, 6), 16);

  for (const width of SEED_WIDTHS) {
    const buffer = await sharp({
      create: {
        width,
        height: Math.round(width * 1.25),
        channels: 3,
        background: { r, g, b },
      },
    })
      .webp({ quality: 80 })
      .toBuffer();

    const path = `products/${productId}/0-${width}.webp`;
    await bucket.file(path).save(buffer, {
      contentType: "image/webp",
      resumable: false,
      metadata: { cacheControl: "public, max-age=31536000" },
    });
  }
}

async function main() {
  setRemoteProject(process.argv);

  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error("FIRESTORE_EMULATOR_HOST is empty — seed runs on the emulator only");
  }

  const { db } = await import("@/lib/firebase/admin");

  const categories = buildSeedCategories();
  for (const cat of categories) {
    const { id, ...data } = cat;
    categorySchema.parse(data);
    await db.collection("categories").doc(id).set(data);
  }

  const brand = buildSeedBrand();
  {
    const { id, ...data } = brand;
    brandSchema.parse(data);
    await db.collection("brands").doc(id).set(data);
  }

  const products = buildSeedProducts();
  for (const item of products) {
    await writePlaceholderImages(item.id, item.color);

    for (const variant of item.variants) {
      const { id, ...data } = variant;
      variantSchema.parse(data);
      await db.collection("products").doc(item.id).collection("variants").doc(id).set(data);
    }

    const productDoc = productSchema.parse({
      ...item.product,
      images: [{ path: `products/${item.id}/0`, alt: item.imageAlt }],
      searchTokens: [],
      minPriceCents: 0,
      maxPriceCents: 0,
      totalStock: 0,
      defaultVariantId: null,
    });
    await db.collection("products").doc(item.id).set(productDoc);
    await recomputeProduct(item.id);
  }

  const expected = seedExpectedCounts();
  await db.collection("meta").doc("seed").set({
    at: new Date().toISOString(),
    ...expected,
  });

  console.log("Seed complete", expected);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

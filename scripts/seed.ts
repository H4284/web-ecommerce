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
import { buildSeedShopSettings } from "@/lib/shop/seed-settings";
import { buildSeedHomeContent } from "@/lib/shop/seed-home-content";
import { shopSettingsSchema } from "@/lib/shop/settings-schema";
import {
  HOME_CONTENT_PATH,
  homeContentSchema,
} from "@/lib/shop/home-content-schema";
import {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
  E2E_DISCOUNT_CODE,
} from "@/lib/shop/seed-e2e";
import { discountSchema } from "@/lib/shop/discounts";
import { setRemoteProject } from "./lib/remote";

async function writePlaceholderImages(productId: string, color: string) {
  const { getBucket } = await import("@/lib/firebase/admin");
  const bucket = getBucket();
  const base = color.replace("#", "");
  const r = Number.parseInt(base.slice(0, 2), 16);
  const g = Number.parseInt(base.slice(2, 4), 16);
  const b = Number.parseInt(base.slice(4, 6), 16);
  const frames = [
    { n: 0, background: { r, g, b } },
    {
      n: 1,
      background: {
        r: Math.min(255, r + 28),
        g: Math.min(255, g + 18),
        b: Math.min(255, b + 12),
      },
    },
  ] as const;

  for (const frame of frames) {
    for (const width of SEED_WIDTHS) {
      const height = Math.round(width * 1.25);
      // Non-flat seed art with noise so LCP treats the hero as a real image.
      const noise = Buffer.alloc(width * height * 3);
      for (let i = 0; i < noise.length; i += 1) {
        noise[i] = Math.floor(Math.random() * 48);
      }
      const noisePng = await sharp(noise, {
        raw: { width, height, channels: 3 },
      })
        .png()
        .toBuffer();
      const bottleW = Math.round(width * 0.28);
      const bottleH = Math.round(height * 0.55);
      const bottleX = Math.round((width - bottleW) / 2);
      const bottleY = Math.round(height * 0.22);
      const svg = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="rgb(${frame.background.r},${frame.background.g},${frame.background.b})"/>
              <stop offset="100%" stop-color="rgb(${Math.max(0, frame.background.r - 40)},${Math.max(0, frame.background.g - 30)},${Math.max(0, frame.background.b - 20)})"/>
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
          <rect x="${bottleX}" y="${bottleY}" width="${bottleW}" height="${bottleH}" rx="${Math.round(bottleW * 0.12)}" fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.7)" stroke-width="${Math.max(2, Math.round(width / 160))}"/>
          <rect x="${bottleX + Math.round(bottleW * 0.3)}" y="${bottleY - Math.round(bottleH * 0.08)}" width="${Math.round(bottleW * 0.4)}" height="${Math.round(bottleH * 0.1)}" rx="2" fill="rgba(255,255,255,0.55)"/>
        </svg>`,
      );
      const buffer = await sharp(svg)
        .composite([{ input: noisePng, blend: "overlay" }])
        .webp({ quality: 82 })
        .toBuffer();

      const path = `products/${productId}/${frame.n}-${width}.webp`;
      await bucket.file(path).save(buffer, {
        contentType: "image/webp",
        resumable: false,
        metadata: { cacheControl: "public, max-age=31536000" },
      });
    }
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
      images: [
        { path: `products/${item.id}/0`, alt: item.imageAlt },
        { path: `products/${item.id}/1`, alt: `${item.imageAlt} — detail` },
      ],
      searchTokens: [],
      minPriceCents: 0,
      maxPriceCents: 0,
      totalStock: 0,
      defaultVariantId: null,
    });
    await db.collection("products").doc(item.id).set(productDoc);
    await recomputeProduct(item.id);
  }

  const shopSettings = buildSeedShopSettings();
  shopSettingsSchema.parse(shopSettings);
  await db.collection("settings").doc("shop").set(shopSettings);

  const homeContent = buildSeedHomeContent();
  homeContentSchema.parse(homeContent);
  await db
    .collection(HOME_CONTENT_PATH.collection)
    .doc(HOME_CONTENT_PATH.id)
    .set(homeContent);

  await seedE2eFixtures();

  const expected = seedExpectedCounts();
  await db.collection("meta").doc("seed").set({
    at: new Date().toISOString(),
    ...expected,
    settings: true,
    homeContent: true,
    e2eAdmin: E2E_ADMIN_EMAIL,
    e2eDiscount: E2E_DISCOUNT_CODE,
  });

  console.log("Seed complete", {
    ...expected,
    settings: true,
    homeContent: true,
    e2eAdmin: E2E_ADMIN_EMAIL,
    e2eDiscount: E2E_DISCOUNT_CODE,
  });
}

/** Admin user + discount code for Playwright golden path. */
async function seedE2eFixtures() {
  const { adminAuth, db } = await import("@/lib/firebase/admin");

  let user;
  try {
    user = await adminAuth.getUserByEmail(E2E_ADMIN_EMAIL);
    await adminAuth.updateUser(user.uid, { password: E2E_ADMIN_PASSWORD });
  } catch {
    user = await adminAuth.createUser({
      email: E2E_ADMIN_EMAIL,
      password: E2E_ADMIN_PASSWORD,
    });
  }
  await adminAuth.setCustomUserClaims(user.uid, { admin: true });

  const discount = discountSchema.parse({
    type: "percent",
    value: 10,
    minSubtotalCents: 0,
    startsAt: "2020-01-01T00:00:00.000Z",
    endsAt: "2099-12-31T23:59:59.000Z",
    usageLimit: null,
    usedCount: 0,
    active: true,
  });
  await db.collection("discounts").doc(E2E_DISCOUNT_CODE).set(discount);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

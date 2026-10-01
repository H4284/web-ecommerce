/**
 * Seed Supabase staging with catalog, settings, home, discount, admin user.
 * Usage: pnpm seed:supabase
 */
import sharp from "sharp";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
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
import { homeContentSchema } from "@/lib/shop/home-content-schema";
import {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
  E2E_DISCOUNT_CODE,
} from "@/lib/shop/seed-e2e";
import { discountSchema } from "@/lib/shop/discounts";
import { recomputeProduct } from "@/lib/shop/catalog-write";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  brandToRow,
  categoryToRow,
  productToRow,
  variantToRow,
} from "@/lib/shop/supabase-mappers";

const ASSETS_ROOT = join(process.cwd(), "scripts", "seed-assets", "products");

/** Resize royalty-free source JPEGs and upload WebP sizes to Supabase Storage. */
async function writeProductImages(productId: string) {
  const admin = getSupabaseAdmin();
  const dir = join(ASSETS_ROOT, productId);

  for (const frame of [0, 1] as const) {
    const sourcePath = join(dir, `${frame}.jpg`);
    if (!existsSync(sourcePath)) {
      throw new Error(`Missing seed image ${sourcePath}`);
    }
    const source = readFileSync(sourcePath);
    const oriented = await sharp(source).rotate().toBuffer();

    for (const width of SEED_WIDTHS) {
      const height = Math.round(width * 1.25);
      const buffer = await sharp(oriented)
        .resize({ width, height, fit: "cover", position: "centre" })
        .webp({ quality: 82 })
        .toBuffer();

      const objectPath = `${productId}/${frame}-${width}.webp`;
      const { error } = await admin.storage
        .from("products")
        .upload(objectPath, buffer, {
          contentType: "image/webp",
          upsert: true,
          cacheControl: "31536000",
        });
      if (error) throw error;
    }
  }
}

async function seedE2eFixtures() {
  const admin = getSupabaseAdmin();

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
  const { error: dErr } = await admin.from("discounts").upsert({
    code: E2E_DISCOUNT_CODE,
    type: discount.type,
    value: discount.value,
    min_subtotal_cents: discount.minSubtotalCents,
    starts_at: discount.startsAt,
    ends_at: discount.endsAt,
    usage_limit: discount.usageLimit,
    used_count: discount.usedCount,
    active: discount.active,
  });
  if (dErr) throw dErr;

  // Admin auth user + profile
  const list = await admin.auth.admin.listUsers({ perPage: 200 });
  let user = list.data.users.find((u) => u.email === E2E_ADMIN_EMAIL);
  if (user) {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password: E2E_ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
  } else {
    const created = await admin.auth.admin.createUser({
      email: E2E_ADMIN_EMAIL,
      password: E2E_ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (created.error) throw created.error;
    user = created.data.user;
  }
  if (!user) throw new Error("admin user missing after create");

  const { error: pErr } = await admin.from("profiles").upsert({
    id: user.id,
    email: E2E_ADMIN_EMAIL,
    is_admin: true,
  });
  if (pErr) throw pErr;
}

async function main() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  }

  const admin = getSupabaseAdmin();
  const categories = buildSeedCategories();
  for (const cat of categories) {
    const { id: _categoryId, ...data } = cat;
    categorySchema.parse(data);
    const { error } = await admin.from("categories").upsert(categoryToRow(cat));
    if (error) throw error;
  }

  const brand = buildSeedBrand();
  {
    const { id: _brandId, ...data } = brand;
    brandSchema.parse(data);
    const { error } = await admin.from("brands").upsert(brandToRow(brand));
    if (error) throw error;
  }

  const products = buildSeedProducts();
  for (const item of products) {
    await writeProductImages(item.id);

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
    {
      const { error } = await admin
        .from("products")
        .upsert(productToRow({ id: item.id, ...productDoc }));
      if (error) throw error;
    }

    for (const variant of item.variants) {
      const { id: _variantId, ...data } = variant;
      variantSchema.parse(data);
      const { error } = await admin
        .from("variants")
        .upsert(variantToRow(item.id, variant));
      if (error) throw error;
    }

    await recomputeProduct(item.id);
  }

  const shopSettings = buildSeedShopSettings();
  shopSettingsSchema.parse(shopSettings);
  {
    const { error } = await admin.from("shop_settings").upsert({
      id: "shop",
      delivery_methods: shopSettings.deliveryMethods,
      payment_methods: shopSettings.paymentMethods,
      order_prefix: shopSettings.orderPrefix,
      orders_inbox: shopSettings.ordersInbox,
      company: shopSettings.company,
    });
    if (error) throw error;
  }

  const homeContent = buildSeedHomeContent();
  homeContentSchema.parse(homeContent);
  {
    const { error } = await admin.from("home_content").upsert({
      id: "home",
      hero_slides: homeContent.heroSlides,
      promo_blocks: homeContent.promoBlocks,
      brand_strip_product_ids: homeContent.brandStripProductIds,
    });
    if (error) throw error;
  }

  await seedE2eFixtures();

  const expected = seedExpectedCounts();
  console.log("Supabase seed complete", {
    ...expected,
    settings: true,
    homeContent: true,
    e2eAdmin: E2E_ADMIN_EMAIL,
    e2eDiscount: E2E_DISCOUNT_CODE,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

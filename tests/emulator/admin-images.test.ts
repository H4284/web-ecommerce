import { beforeAll, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import {
  createEmulatorSession,
  mockSessionCookie,
} from "./helpers/session";
import { IMAGE_WIDTHS, MAX_IMAGE_BYTES } from "@/lib/images/widths";

vi.mock("next/cache", () => ({
  updateTag: () => undefined,
  revalidateTag: () => undefined,
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

async function tinyPng(): Promise<Buffer> {
  return sharp({
    create: { width: 40, height: 50, channels: 3, background: { r: 20, g: 40, b: 60 } },
  })
    .png()
    .toBuffer();
}

describe.skipIf(!hasEmulator)("admin product images", () => {
  beforeAll(async () => {
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||= "demo-sanem.appspot.com";
    process.env.GCLOUD_PROJECT ||= "demo-sanem";
    const { setRemoteProject } = await import("../../scripts/lib/remote");
    setRemoteProject(process.argv);
    const { execFileSync } = await import("node:child_process");
    execFileSync(
      "pnpm",
      ["exec", "tsx", "--conditions=react-server", "--env-file-if-exists=.env.local", "scripts/seed.ts"],
      { stdio: "inherit", env: process.env, shell: true },
    );
  }, 120_000);

  it("uploads three frames at four widths, keeps order, refuses oversized", async () => {
    const session = await createEmulatorSession({
      email: `admin-img-${Date.now()}@example.com`,
      admin: true,
    });
    vi.resetModules();
    vi.doMock("next/headers", () => mockSessionCookie(session.sessionCookie));

    const { getBucket, db } = await import("@/lib/firebase/admin");
    const { uploadAdminProductImage, ImageTooLargeError } =
      await import("@/lib/shop/admin-images");
    const { getAdminProduct, saveAdminProduct } =
      await import("@/lib/shop/admin-products");
    const { getProductBySlug } = await import("@/lib/shop/catalog-queries");

    const stamp = Date.now();
    const created = await saveAdminProduct({
      id: null,
      name: `Img Test ${stamp}`,
      slug: `img-test-${stamp}`,
      brandId: "sanem",
      categoryIds: ["women"],
      shortDescription: "img",
      description: "img",
      images: [{ path: "products/tmp/0", alt: "tmp" }],
      options: [],
      status: "active",
      isNew: false,
      isBestSeller: false,
      unit: null,
      relatedIds: [],
      seoTitle: "",
      seoDescription: "",
      variants: [
        {
          sku: `IMG-${stamp}`,
          optionValues: {},
          priceCents: 1000,
          compareAtCents: null,
          stock: 2,
          isDefault: true,
        },
      ],
    });

    const png = await tinyPng();
    const uploaded = [];
    for (const alt of ["one", "two", "three"]) {
      uploaded.push(
        await uploadAdminProductImage({
          productId: created.id,
          alt,
          buffer: png,
        }),
      );
    }

    expect(uploaded).toHaveLength(3);
    expect(uploaded.map((u) => u.path)).toEqual([
      `products/${created.id}/0`,
      `products/${created.id}/1`,
      `products/${created.id}/2`,
    ]);

    const bucket = getBucket();
    for (const img of uploaded) {
      for (const width of IMAGE_WIDTHS) {
        const [exists] = await bucket.file(`${img.path}-${width}.webp`).exists();
        expect(exists).toBe(true);
      }
    }

    // Reorder on save: 2, 0, 1
    const detail = await getAdminProduct(created.id);
    expect(detail).not.toBeNull();
    const reordered = [uploaded[2]!, uploaded[0]!, uploaded[1]!];
    await saveAdminProduct({
      id: created.id,
      name: detail!.name,
      slug: detail!.slug,
      brandId: detail!.brandId,
      categoryIds: detail!.categoryIds,
      shortDescription: detail!.shortDescription,
      description: detail!.description,
      images: reordered,
      options: detail!.options,
      status: "active",
      isNew: false,
      isBestSeller: false,
      unit: null,
      relatedIds: [],
      seoTitle: "",
      seoDescription: "",
      variants: detail!.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        optionValues: v.optionValues,
        priceCents: v.priceCents,
        compareAtCents: v.compareAtCents ?? null,
        stock: v.stock,
        isDefault: v.isDefault,
      })),
    });

    const storefront = await getProductBySlug(`img-test-${stamp}`);
    expect(storefront).not.toBeNull();
    expect(storefront!.images.map((i) => i.path)).toEqual(
      reordered.map((i) => i.path),
    );
    expect(storefront!.images.map((i) => i.alt)).toEqual(["three", "one", "two"]);

    const huge = Buffer.alloc(MAX_IMAGE_BYTES + 1, 1);
    await expect(
      uploadAdminProductImage({
        productId: created.id,
        alt: "huge",
        buffer: huge,
      }),
    ).rejects.toBeInstanceOf(ImageTooLargeError);

    // Fourth upload gets n=3 (never overwrites 0–2)
    const fourth = await uploadAdminProductImage({
      productId: created.id,
      alt: "four",
      buffer: png,
    });
    expect(fourth.path).toBe(`products/${created.id}/3`);

    const snap = await db.collection("products").doc(created.id).get();
    expect(snap.data()?.images?.length).toBeGreaterThanOrEqual(4);
  }, 120_000);
});

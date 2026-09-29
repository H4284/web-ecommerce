import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  createEmulatorSession,
  mockSessionCookie,
} from "./helpers/session";

vi.mock("next/cache", () => ({
  updateTag: () => undefined,
  revalidateTag: () => undefined,
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

describe.skipIf(!hasEmulator)("admin products", () => {
  beforeAll(async () => {
    const { setRemoteProject } = await import("../../scripts/lib/remote");
    setRemoteProject(process.argv);
    const { execFileSync } = await import("node:child_process");
    execFileSync(
      "pnpm",
      ["exec", "tsx", "--conditions=react-server", "--env-file-if-exists=.env.local", "scripts/seed.ts"],
      { stdio: "inherit", env: process.env, shell: true },
    );
  }, 120_000);

  async function withAdmin<T>(fn: () => Promise<T>): Promise<T> {
    const session = await createEmulatorSession({
      email: `admin-prod-${Date.now()}@example.com`,
      admin: true,
    });
    vi.resetModules();
    vi.doMock("next/headers", () => mockSessionCookie(session.sessionCookie));
    return fn();
  }

  it("saves a 2×2 product, archives it out of search, and refuses stale stock", async () => {
    await withAdmin(async () => {
      const { saveAdminProduct, updateAdminStock, getAdminProduct } =
        await import("@/lib/shop/admin-products");
      const { searchProducts } = await import("@/lib/shop/catalog-queries");
      const { db } = await import("@/lib/firebase/admin");

      const stamp = Date.now();
      const saved = await saveAdminProduct({
        id: null,
        name: `Test Dual ${stamp}`,
        slug: `test-dual-${stamp}`,
        brandId: "sanem",
        categoryIds: ["women"],
        shortDescription: "Test",
        description: "Body",
        images: [{ path: "products/tmp/0", alt: "tmp" }],
        options: [
          { name: "Aroma", values: ["Iris", "Oud"] },
          { name: "Madhësia", values: ["50 ml", "100 ml"] },
        ],
        status: "active",
        isNew: false,
        isBestSeller: false,
        unit: null,
        relatedIds: [],
        seoTitle: "",
        seoDescription: "",
        variants: [
          {
            sku: "TD-IR-50",
            optionValues: { Aroma: "Iris", Madhësia: "50 ml" },
            priceCents: 4500,
            compareAtCents: null,
            stock: 5,
            isDefault: true,
          },
          {
            sku: "TD-IR-100",
            optionValues: { Aroma: "Iris", Madhësia: "100 ml" },
            priceCents: 7900,
            compareAtCents: null,
            stock: 3,
            isDefault: false,
          },
          {
            sku: "TD-OU-50",
            optionValues: { Aroma: "Oud", Madhësia: "50 ml" },
            priceCents: 5000,
            compareAtCents: null,
            stock: 2,
            isDefault: false,
          },
          {
            sku: "TD-OU-100",
            optionValues: { Aroma: "Oud", Madhësia: "100 ml" },
            priceCents: 8500,
            compareAtCents: null,
            stock: 1,
            isDefault: false,
          },
        ],
      });

      const detail = await getAdminProduct(saved.id);
      expect(detail).not.toBeNull();
      expect(detail!.variants).toHaveLength(4);
      expect(detail!.status).toBe("active");

      const bySlug = await db
        .collection("products")
        .where("slug", "==", `test-dual-${stamp}`)
        .where("status", "==", "active")
        .limit(1)
        .get();
      expect(bySlug.empty).toBe(false);

      await saveAdminProduct({
        id: saved.id,
        name: detail!.name,
        slug: detail!.slug,
        brandId: detail!.brandId,
        categoryIds: detail!.categoryIds,
        shortDescription: detail!.shortDescription,
        description: detail!.description,
        images: detail!.images,
        options: detail!.options,
        status: "archived",
        isNew: detail!.isNew,
        isBestSeller: detail!.isBestSeller,
        unit: detail!.unit ?? null,
        relatedIds: detail!.relatedIds,
        seoTitle: detail!.seo?.title ?? "",
        seoDescription: detail!.seo?.description ?? "",
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

      const archivedQ = await db
        .collection("products")
        .where("slug", "==", `test-dual-${stamp}`)
        .where("status", "==", "active")
        .limit(1)
        .get();
      expect(archivedQ.empty).toBe(true);

      const searchAfter = await searchProducts("test", 50);
      expect(searchAfter.every((p) => p.id !== saved.id)).toBe(true);

      const variant = detail!.variants[0]!;
      await db
        .collection("products")
        .doc(saved.id)
        .collection("variants")
        .doc(variant.id)
        .update({ stock: variant.stock + 1 });

      await expect(
        updateAdminStock({
          productId: saved.id,
          variantId: variant.id,
          expectedStock: variant.stock,
          nextStock: 99,
        }),
      ).rejects.toThrow(/stock_changed/);

      const audits = await db
        .collection("auditLogs")
        .where("action", "==", "product.save")
        .get();
      const ours = audits.docs.filter((d) => {
        const t = String(d.data().target ?? "");
        return t.includes(saved.id) || t.includes(`test-dual-${stamp}`);
      });
      expect(ours.length).toBeGreaterThanOrEqual(1);
    });
  }, 120_000);
});

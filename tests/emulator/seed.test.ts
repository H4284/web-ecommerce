import { beforeAll, describe, expect, it } from "vitest";
import { SEED_WIDTHS, seedExpectedCounts } from "@/lib/shop/seed-catalog";

const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

describe.skipIf(!hasEmulator)("seed against emulator", () => {
  beforeAll(async () => {
    const { setRemoteProject } = await import("../../scripts/lib/remote");
    setRemoteProject(process.argv);
    // Re-run seed logic by spawning would be slow; call the modules directly.
    const { execFileSync } = await import("node:child_process");
    execFileSync(
      "pnpm",
      ["exec", "tsx", "--conditions=react-server", "--env-file-if-exists=.env.local", "scripts/seed.ts"],
      { stdio: "inherit", env: process.env, shell: true },
    );
  }, 120_000);

  it("has stable category, brand and product counts after two seeds", async () => {
    const { execFileSync } = await import("node:child_process");
    execFileSync(
      "pnpm",
      ["exec", "tsx", "--conditions=react-server", "--env-file-if-exists=.env.local", "scripts/seed.ts"],
      { stdio: "inherit", env: process.env, shell: true },
    );

    const { db } = await import("@/lib/firebase/admin");
    const expected = seedExpectedCounts();
    const [cats, brands, products] = await Promise.all([
      db.collection("categories").get(),
      db.collection("brands").get(),
      db.collection("products").get(),
    ]);
    expect(cats.size).toBe(expected.categories);
    expect(brands.size).toBe(expected.brands);
    expect(products.size).toBe(expected.products);

    let dual = 0;
    for (const doc of products.docs) {
      const options = doc.data().options as unknown[];
      if (Array.isArray(options) && options.length === 2) dual += 1;
    }
    expect(dual).toBe(expected.dualAxis);
  }, 120_000);

  it("stores placeholder images at four widths for three products", async () => {
    const { getBucket } = await import("@/lib/firebase/admin");
    const bucket = getBucket();
    for (const id of ["prod-01", "prod-02", "prod-03"]) {
      for (const width of SEED_WIDTHS) {
        const [exists] = await bucket.file(`products/${id}/0-${width}.webp`).exists();
        expect(exists).toBe(true);
      }
    }
  });

  it("recomputed fields match variants for three products", async () => {
    const { db } = await import("@/lib/firebase/admin");
    for (const id of ["prod-01", "prod-05", "prod-10"]) {
      const product = (await db.collection("products").doc(id).get()).data()!;
      const variants = await db.collection("products").doc(id).collection("variants").get();
      const prices = variants.docs.map((d) => d.data().priceCents as number);
      const stock = variants.docs.reduce((n, d) => n + (d.data().stock as number), 0);
      expect(product.minPriceCents).toBe(Math.min(...prices));
      expect(product.maxPriceCents).toBe(Math.max(...prices));
      expect(product.totalStock).toBe(stock);
      expect(variants.docs.some((d) => d.id === product.defaultVariantId)).toBe(true);
      expect((product.searchTokens as string[]).length).toBeGreaterThan(0);
    }
  });
});

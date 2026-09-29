import { beforeAll, describe, expect, it } from "vitest";
import { validateCart } from "@/lib/shop/cart-validate";
import { shopCopy } from "@/content/shop";

const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

/**
 * Needs emulators + seeded catalog (`pnpm test:emulator`).
 * Verifies live price/stock reads (no cache) for cart validate.
 */
describe.skipIf(!hasEmulator)("cart validate against emulator", () => {
  beforeAll(async () => {
    const { setRemoteProject } = await import("../../scripts/lib/remote");
    setRemoteProject(process.argv);
    // Ensure catalog exists (seed is idempotent).
    const { execFileSync } = await import("node:child_process");
    execFileSync(
      "pnpm",
      ["exec", "tsx", "--conditions=react-server", "--env-file-if-exists=.env.local", "scripts/seed.ts"],
      { stdio: "inherit", env: process.env, shell: true },
    );
  }, 120_000);

  it("returns live price and clamps qty above stock", async () => {
    const { db } = await import("@/lib/firebase/admin");
    const productId = "prod-01";

    const variants = await db.collection("products").doc(productId).collection("variants").get();
    expect(variants.size).toBeGreaterThan(0);
    const first = variants.docs[0]!;
    const data = first.data();
    const originalPrice = data.priceCents as number;
    const originalStock = data.stock as number;

    await first.ref.update({ priceCents: originalPrice + 111, stock: 2 });

    try {
      const result = await validateCart({
        lines: [{ variantId: first.id, productId, qty: 9 }],
      });

      expect(result.lines).toHaveLength(1);
      expect(result.lines[0]?.priceCents).toBe(originalPrice + 111);
      expect(result.lines[0]?.qty).toBe(2);
      expect(result.messages).toContain(shopCopy.cartQtyClamped);
    } finally {
      await first.ref.update({ priceCents: originalPrice, stock: originalStock });
    }
  });

  it("returns the four discount messages from Firestore codes", async () => {
    const { db } = await import("@/lib/firebase/admin");
    const stamp = "2026-09-29T12:00:00.000Z";
    const now = new Date(stamp);

    await db.collection("discounts").doc("BADACTIVE").set({
      type: "percent",
      value: 10,
      minSubtotalCents: 0,
      startsAt: "2026-01-01T00:00:00.000Z",
      endsAt: "2027-01-01T00:00:00.000Z",
      usageLimit: null,
      usedCount: 0,
      active: false,
    });
    await db.collection("discounts").doc("EXPIRED").set({
      type: "percent",
      value: 10,
      minSubtotalCents: 0,
      startsAt: "2020-01-01T00:00:00.000Z",
      endsAt: "2021-01-01T00:00:00.000Z",
      usageLimit: null,
      usedCount: 0,
      active: true,
    });
    await db.collection("discounts").doc("MINORD").set({
      type: "fixed",
      value: 500,
      minSubtotalCents: 999_999,
      startsAt: "2026-01-01T00:00:00.000Z",
      endsAt: "2027-01-01T00:00:00.000Z",
      usageLimit: null,
      usedCount: 0,
      active: true,
    });
    await db.collection("discounts").doc("MAXED").set({
      type: "percent",
      value: 10,
      minSubtotalCents: 0,
      startsAt: "2026-01-01T00:00:00.000Z",
      endsAt: "2027-01-01T00:00:00.000Z",
      usageLimit: 1,
      usedCount: 1,
      active: true,
    });

    const productId = "prod-01";
    const variants = await db.collection("products").doc(productId).collection("variants").get();
    const first = variants.docs[0]!;
    const line = { variantId: first.id, productId, qty: 1 };

    const missing = await validateCart({ lines: [line], discountCode: "NOPE", now });
    expect(missing.discount.message).toBe(shopCopy.discountInvalid);

    const inactive = await validateCart({ lines: [line], discountCode: "BADACTIVE", now });
    expect(inactive.discount.message).toBe(shopCopy.discountInvalid);

    const expired = await validateCart({ lines: [line], discountCode: "EXPIRED", now });
    expect(expired.discount.message).toBe(shopCopy.discountExpired);

    const minimum = await validateCart({ lines: [line], discountCode: "MINORD", now });
    expect(minimum.discount.message).toBe(shopCopy.discountMinimum);

    const limit = await validateCart({ lines: [line], discountCode: "MAXED", now });
    expect(limit.discount.message).toBe(shopCopy.discountLimit);
  });
});
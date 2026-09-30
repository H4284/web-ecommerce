import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  createEmulatorSession,
  mockGuestCookies,
  mockSessionCookie,
} from "./helpers/session";
import type { CreateOrderBody } from "@/lib/shop/order-schema";
import { shopCopy } from "@/content/shop";

vi.mock("next/cache", () => ({
  updateTag: () => undefined,
  revalidateTag: () => undefined,
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

function baseBody(
  lines: CreateOrderBody["lines"],
  extra: Partial<CreateOrderBody> = {},
): CreateOrderBody {
  return {
    email: "discount-buyer@example.com",
    delivery: {
      country: "XK",
      city: "Prishtinë",
      recipient: "Discount Buyer",
      address: "Rruga Zbritje 1",
      postalCode: "10000",
      phone: "+38349555666",
    },
    billingSameAsDelivery: true,
    deliveryMethodId: "kosovo",
    paymentMethodId: "cod",
    newsletterOptIn: false,
    termsAccepted: true,
    website: "",
    turnstileToken: "dev-turnstile-token",
    lines,
    ...extra,
  };
}

async function withAdmin<T>(fn: () => Promise<T>): Promise<T> {
  const session = await createEmulatorSession({
    email: `admin-disc-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    admin: true,
  });
  vi.resetModules();
  vi.doMock("next/headers", () => mockSessionCookie(session.sessionCookie));
  return fn();
}

async function createGuestOrder(body: CreateOrderBody) {
  vi.resetModules();
  vi.doMock("next/headers", () => mockGuestCookies());
  const { createOrder } = await import("@/lib/shop/order-create");
  return createOrder(body);
}

describe.skipIf(!hasEmulator)("admin discounts", () => {
  beforeAll(async () => {
    process.env.ORDER_LINK_SECRET ||= "emulator-order-link-secret";
    delete process.env.RESEND_API_KEY;
    const { setRemoteProject } = await import("../../scripts/lib/remote");
    setRemoteProject(process.argv);
    const { execFileSync } = await import("node:child_process");
    execFileSync(
      "pnpm",
      ["exec", "tsx", "--conditions=react-server", "--env-file-if-exists=.env.local", "scripts/seed.ts"],
      { stdio: "inherit", env: process.env, shell: true },
    );
  }, 120_000);

  it("10% code with limit 2 works twice then fails; admin shows 2 uses", async () => {
    const code = `SAVE10L2${Date.now().toString(36).toUpperCase()}`;

    await withAdmin(async () => {
      const { saveAdminDiscount } = await import("@/lib/shop/admin-discounts");
      await saveAdminDiscount({
        code,
        type: "percent",
        value: 10,
        minSubtotalCents: 0,
        startsAt: "2026-01-01T00:00:00.000Z",
        endsAt: "2027-12-31T23:59:59.000Z",
        usageLimit: 2,
        active: true,
      });
    });

    const { db } = await import("@/lib/firebase/admin");
    const productId = "prod-03";
    const variants = await db
      .collection("products")
      .doc(productId)
      .collection("variants")
      .get();
    const variant = variants.docs[0]!;
    const line = { variantId: variant.id, productId, qty: 1 };

    await createGuestOrder(baseBody([line], { discountCode: code }));
    await createGuestOrder(baseBody([line], { discountCode: code }));

    await expect(
      createGuestOrder(baseBody([line], { discountCode: code })),
    ).rejects.toThrow();

    // Confirm cart-validate style message via evaluate on stored doc
    const snap = await db.collection("discounts").doc(code).get();
    expect(snap.data()?.usedCount).toBe(2);

    const listed = await withAdmin(async () => {
      const { listAdminDiscounts, getAdminDiscount } = await import(
        "@/lib/shop/admin-discounts"
      );
      const one = await getAdminDiscount(code);
      const all = await listAdminDiscounts();
      return { one, all };
    });

    expect(listed.one?.usedCount).toBe(2);
    expect(listed.one?.usageLimit).toBe(2);
    expect(listed.all.find((d) => d.code === code)?.usedCount).toBe(2);

    // Third attempt should hit discount limit when validating
    vi.resetModules();
    vi.doMock("next/headers", () => mockGuestCookies());
    const { validateCart } = await import("@/lib/shop/cart-validate");
    const validated = await validateCart({
      lines: [line],
      discountCode: code,
    });
    expect(validated.discount.message).toBe(shopCopy.discountLimit);
    expect(validated.discount.amountCents).toBe(0);
  }, 120_000);
});

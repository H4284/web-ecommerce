import { beforeAll, describe, expect, it } from "vitest";
import {
  createOrder,
  OrderStockError,
} from "@/lib/shop/order-create";
import type { CreateOrderBody } from "@/lib/shop/order-schema";

const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

function baseBody(
  lines: CreateOrderBody["lines"],
  extra: Partial<CreateOrderBody> = {},
): CreateOrderBody {
  return {
    email: "test@example.com",
    delivery: {
      country: "XK",
      city: "Prishtinë",
      recipient: "Test Test",
      address: "Rruga Test 1",
      postalCode: "10000",
      phone: "+38349123456",
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

describe.skipIf(!hasEmulator)("order create against emulator", () => {
  beforeAll(async () => {
    process.env.ORDER_LINK_SECRET ||= "emulator-order-link-secret";
    const { setRemoteProject } = await import("../../scripts/lib/remote");
    setRemoteProject(process.argv);
    const { execFileSync } = await import("node:child_process");
    execFileSync(
      "pnpm",
      ["exec", "tsx", "--conditions=react-server", "--env-file-if-exists=.env.local", "scripts/seed.ts"],
      { stdio: "inherit", env: process.env, shell: true },
    );
  }, 120_000);

  it("creates an order with the next number and drops stock", async () => {
    const { db } = await import("@/lib/firebase/admin");
    const productId = "prod-02";
    const variants = await db.collection("products").doc(productId).collection("variants").get();
    const variant = variants.docs[0]!;
    const beforeStock = variant.data().stock as number;
    const productBefore = (await db.collection("products").doc(productId).get()).data()!;
    const counterBefore = await db.collection("counters").doc("orders").get();
    const seqBefore = counterBefore.exists
      ? Number((counterBefore.data() as { seq?: number }).seq ?? 0)
      : 0;

    const result = await createOrder(
      baseBody([{ variantId: variant.id, productId, qty: 1 }]),
    );

    expect(result.number).toMatch(/^SAN-\d{4}-\d{5}$/);
    expect(result.orderId).toBeTruthy();
    expect(result.thankYouUrl).toContain(`/orders/${result.orderId}/thank-you?t=`);

    const order = (await db.collection("orders").doc(result.orderId).get()).data()!;
    expect(order.number).toBe(result.number);
    expect(order.status).toBe("pending");
    expect(order.paymentStatus).toBe("cod_due");
    expect(order.stockTaken).toBe(true);
    expect(order.totalCents).toBeGreaterThan(0);

    const afterStock = ((await variant.ref.get()).data() as { stock: number }).stock;
    expect(afterStock).toBe(beforeStock - 1);
    expect(afterStock).toBeGreaterThanOrEqual(0);

    const productAfter = (await db.collection("products").doc(productId).get()).data()!;
    expect(productAfter.totalStock).toBe(productBefore.totalStock - 1);

    const counterAfter = await db.collection("counters").doc("orders").get();
    expect(Number((counterAfter.data() as { seq: number }).seq)).toBe(seqBefore + 1);
  });

  it("ignores tampered client prices and stores the server total", async () => {
    const { db } = await import("@/lib/firebase/admin");
    const productId = "prod-03";
    const variants = await db.collection("products").doc(productId).collection("variants").get();
    const variant = variants.docs[0]!;
    const serverPrice = variant.data().priceCents as number;

    const result = await createOrder(
      baseBody([{ variantId: variant.id, productId, qty: 1 }]),
    );
    const order = (await db.collection("orders").doc(result.orderId).get()).data()!;
    expect(order.lines[0].priceCents).toBe(serverPrice);
    expect(order.subtotalCents).toBe(serverPrice);
    // Client cannot lower the stored total by sending fake prices (lines schema has no price).
    expect(order.totalCents).toBeGreaterThanOrEqual(serverPrice);
  });

  it("rejects duplicate lines that exceed stock", async () => {
    const { db } = await import("@/lib/firebase/admin");
    const productId = "prod-04";
    const variants = await db.collection("products").doc(productId).collection("variants").get();
    const variant = variants.docs[0]!;
    await variant.ref.update({ stock: 2 });

    await expect(
      createOrder(
        baseBody([
          { variantId: variant.id, productId, qty: 2 },
          { variantId: variant.id, productId, qty: 2 },
        ]),
      ),
    ).rejects.toBeInstanceOf(OrderStockError);

    const stock = ((await variant.ref.get()).data() as { stock: number }).stock;
    expect(stock).toBe(2);
  });

  it("lets only one of two parallel last-unit orders win", async () => {
    const { db } = await import("@/lib/firebase/admin");
    const productId = "prod-05";
    const variants = await db.collection("products").doc(productId).collection("variants").get();
    const variant = variants.docs[0]!;
    await variant.ref.update({ stock: 1 });
    // Keep product totalStock consistent enough for the write.
    const product = (await db.collection("products").doc(productId).get()).data()!;
    if ((product.totalStock as number) < 1) {
      await db.collection("products").doc(productId).update({ totalStock: 1 });
    }

    const body = baseBody([{ variantId: variant.id, productId, qty: 1 }]);
    const settled = await Promise.allSettled([createOrder(body), createOrder(body)]);

    const ok = settled.filter((s) => s.status === "fulfilled");
    const fail = settled.filter((s) => s.status === "rejected");
    expect(ok).toHaveLength(1);
    expect(fail).toHaveLength(1);
    expect(fail[0]?.status === "rejected" && fail[0].reason).toBeInstanceOf(OrderStockError);

    const stock = ((await variant.ref.get()).data() as { stock: number }).stock;
    expect(stock).toBe(0);
  });
});

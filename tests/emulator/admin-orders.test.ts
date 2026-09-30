import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  createEmulatorSession,
  mockGuestCookies,
  mockSessionCookie,
} from "./helpers/session";
import type { CreateOrderBody } from "@/lib/shop/order-schema";

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
    email: "buyer@example.com",
    delivery: {
      country: "XK",
      city: "Prishtinë",
      recipient: "Buyer Name",
      address: "Rruga Test 1",
      postalCode: "10000",
      phone: "+38349111222",
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

async function createGuestOrder(body: CreateOrderBody) {
  vi.resetModules();
  vi.doMock("next/headers", () => mockGuestCookies());
  const { createOrder } = await import("@/lib/shop/order-create");
  return createOrder(body);
}

async function withAdmin<T>(
  fn: () => Promise<T>,
): Promise<T> {
  const session = await createEmulatorSession({
    email: `admin-orders-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    admin: true,
  });
  vi.resetModules();
  vi.doMock("next/headers", () => mockSessionCookie(session.sessionCookie));
  return fn();
}

describe.skipIf(!hasEmulator)("admin orders", () => {
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

  it("ships with a note → status email + timeline note", async () => {
    const { db } = await import("@/lib/firebase/admin");
    const productId = "prod-02";
    const variants = await db
      .collection("products")
      .doc(productId)
      .collection("variants")
      .get();
    const variant = variants.docs[0]!;

    const created = await createGuestOrder(
      baseBody([{ variantId: variant.id, productId, qty: 1 }]),
    );

    await withAdmin(async () => {
      const { emailSendStats: stats } = await import("@/lib/shop/email");
      stats.reset();
      const { updateAdminOrderStatus } = await import("@/lib/shop/admin-orders");
      await updateAdminOrderStatus({
        orderId: created.orderId,
        status: "shipped",
        note: "Dërguar me Postën",
      });
      expect(stats.status).toBe(1);
    });

    const order = (await db.collection("orders").doc(created.orderId).get()).data()!;
    expect(order.status).toBe("shipped");
    expect(order.emails?.statusAt).toBeTruthy();
    const notes = (order.timeline as Array<{ status: string; note: string }>).map(
      (t) => t.note,
    );
    expect(notes).toContain("Dërguar me Postën");
  }, 60_000);

  it("cancel twice restores stock once; unpaid card restores none", async () => {
    const { db } = await import("@/lib/firebase/admin");
    const productId = "prod-02";
    const variants = await db
      .collection("products")
      .doc(productId)
      .collection("variants")
      .get();
    const variant = variants.docs[0]!;
    const beforeStock = Number(variant.data().stock);

    const created = await createGuestOrder(
      baseBody([{ variantId: variant.id, productId, qty: 1 }]),
    );
    const afterCreate = Number((await variant.ref.get()).data()!.stock);
    expect(afterCreate).toBe(beforeStock - 1);

    await withAdmin(async () => {
      const { updateAdminOrderStatus } = await import("@/lib/shop/admin-orders");
      await updateAdminOrderStatus({
        orderId: created.orderId,
        status: "cancelled",
        note: "first",
      });
    });
    const afterFirst = Number((await variant.ref.get()).data()!.stock);
    expect(afterFirst).toBe(beforeStock);

    await withAdmin(async () => {
      const { updateAdminOrderStatus } = await import("@/lib/shop/admin-orders");
      await updateAdminOrderStatus({
        orderId: created.orderId,
        status: "cancelled",
        note: "second",
      });
    });
    const afterSecond = Number((await variant.ref.get()).data()!.stock);
    expect(afterSecond).toBe(beforeStock);

    const cardRef = db.collection("orders").doc();
    const cardStockBefore = Number((await variant.ref.get()).data()!.stock);
    await cardRef.set({
      number: "SAN-CARD-TEST",
      status: "pending",
      paymentStatus: "awaiting_payment",
      paymentMethodId: "bank-card",
      stockTaken: false,
      customer: {
        email: "card@example.com",
        name: "Card Buyer",
        phone: "+38349000000",
        uid: null,
      },
      delivery: {
        recipient: "Card Buyer",
        address: "Rruga 1",
        city: "Prishtinë",
        postalCode: "10000",
        phone: "+38349000000",
        country: "XK",
      },
      lines: [
        {
          variantId: variant.id,
          productId,
          sku: "SKU",
          name: "P",
          variantLabel: "50ml",
          priceCents: 1000,
          qty: 1,
        },
      ],
      subtotalCents: 1000,
      discount: { amountCents: 0 },
      deliveryCents: 200,
      totalCents: 1200,
      deliveryMethodId: "kosovo",
      createdAt: new Date().toISOString(),
      timeline: [],
      internalNote: "",
    });

    await withAdmin(async () => {
      const { updateAdminOrderStatus } = await import("@/lib/shop/admin-orders");
      await updateAdminOrderStatus({
        orderId: cardRef.id,
        status: "cancelled",
        note: "card cancel",
      });
    });
    const afterCard = Number((await variant.ref.get()).data()!.stock);
    expect(afterCard).toBe(cardStockBefore);

    const cardOrder = (await cardRef.get()).data()!;
    expect(cardOrder.status).toBe("cancelled");
    expect(cardOrder.stockTaken).toBe(false);
  }, 90_000);

  it("CSV has UTF-8 BOM and Albanian letters", async () => {
    const { db } = await import("@/lib/firebase/admin");
    await db.collection("orders").doc("csv-ëç").set({
      number: "SAN-ËÇ-00001",
      status: "pending",
      paymentStatus: "cod_due",
      paymentMethodId: "cod",
      stockTaken: true,
      customer: {
        email: "ëç@example.com",
        name: "Agim Ëç",
        phone: "+38349123456",
        uid: null,
      },
      delivery: {
        recipient: "Agim Ëç",
        address: "Rruga Çajupi",
        city: "Prishtinë",
        phone: "+38349123456",
        country: "XK",
      },
      lines: [],
      subtotalCents: 0,
      discount: { amountCents: 0 },
      deliveryCents: 0,
      totalCents: 0,
      deliveryMethodId: "kosovo",
      createdAt: new Date().toISOString(),
      timeline: [],
      internalNote: "",
    });

    const csv = await withAdmin(async () => {
      const { exportAdminOrdersCsv } = await import("@/lib/shop/admin-orders");
      return exportAdminOrdersCsv({ q: "Ëç" });
    });
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("Agim Ëç");
    expect(csv).toContain("Prishtinë");
  }, 60_000);

  it("marks transfer order as paid", async () => {
    const { db } = await import("@/lib/firebase/admin");
    const ref = db.collection("orders").doc();
    await ref.set({
      number: "SAN-TR-00001",
      status: "pending",
      paymentStatus: "awaiting_payment",
      paymentMethodId: "transfer",
      stockTaken: true,
      customer: {
        email: "tr@example.com",
        name: "Transfer",
        phone: "+38349111111",
        uid: null,
      },
      delivery: {
        recipient: "Transfer",
        address: "A",
        city: "Prishtinë",
        phone: "+38349111111",
        country: "XK",
      },
      lines: [],
      subtotalCents: 1000,
      discount: { amountCents: 0 },
      deliveryCents: 200,
      totalCents: 1200,
      deliveryMethodId: "kosovo",
      createdAt: new Date().toISOString(),
      timeline: [],
      internalNote: "",
    });

    await withAdmin(async () => {
      const { markAdminOrderPaid } = await import("@/lib/shop/admin-orders");
      await markAdminOrderPaid({ orderId: ref.id, note: "Wire received" });
    });

    const order = (await ref.get()).data()!;
    expect(order.paymentStatus).toBe("paid");
    const notes = (order.timeline as Array<{ note: string }>).map((t) => t.note);
    expect(notes.some((n) => n.includes("Wire") || n.includes("paid"))).toBe(true);
  }, 60_000);
});

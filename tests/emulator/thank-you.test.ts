import { beforeAll, describe, expect, it } from "vitest";
import { createOrder } from "@/lib/shop/order-create";
import { signOrderLink, verifyOrderLink } from "@/lib/shop/order-link";
import { getOrderForThankYou } from "@/lib/shop/order-queries";
import type { CreateOrderBody } from "@/lib/shop/order-schema";

const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

function baseBody(lines: CreateOrderBody["lines"]): CreateOrderBody {
  return {
    email: "thanks@example.com",
    delivery: {
      country: "XK",
      city: "Prishtinë",
      recipient: "Thanks Guest",
      address: "Rruga Faleminderit 3",
      postalCode: "10000",
      phone: "+38349333444",
    },
    billingSameAsDelivery: true,
    deliveryMethodId: "kosovo",
    paymentMethodId: "cod",
    newsletterOptIn: false,
    termsAccepted: true,
    website: "",
    turnstileToken: "dev-turnstile-token",
    lines,
  };
}

describe.skipIf(!hasEmulator)("thank-you order access", () => {
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

  it("loads the order with a valid token and rejects a changed token", async () => {
    const { db } = await import("@/lib/firebase/admin");
    const productId = "prod-07";
    const variants = await db
      .collection("products")
      .doc(productId)
      .collection("variants")
      .get();
    const variant = variants.docs[0]!;

    const result = await createOrder(
      baseBody([{ variantId: variant.id, productId, qty: 1 }]),
    );

    const token = signOrderLink(result.orderId);
    expect(verifyOrderLink(result.orderId, token)).toBe(true);
    expect(verifyOrderLink(result.orderId, "0".repeat(token.length))).toBe(false);
    expect(verifyOrderLink(result.orderId, "short")).toBe(false);

    const order = await getOrderForThankYou(result.orderId);
    expect(order).not.toBeNull();
    expect(order!.number).toBe(result.number);
    expect(order!.lines.length).toBeGreaterThan(0);
    expect(order!.totalCents).toBeGreaterThan(0);
  }, 60_000);
});

import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createOrder } from "@/lib/shop/order-create";
import { emailSendStats, sendOrderEmails } from "@/lib/shop/email";
import type { CreateOrderBody } from "@/lib/shop/order-schema";

const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

function baseBody(lines: CreateOrderBody["lines"]): CreateOrderBody {
  return {
    email: "buyer@example.com",
    delivery: {
      country: "XK",
      city: "Prishtinë",
      recipient: "Buyer Name",
      address: "Rruga Email 2",
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
  };
}

describe.skipIf(!hasEmulator)("order emails against emulator", () => {
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

  beforeEach(() => {
    emailSendStats.reset();
  });

  it("sends one confirmation and one admin email; a second call sends nothing", async () => {
    const { db } = await import("@/lib/firebase/admin");
    const productId = "prod-06";
    const variants = await db
      .collection("products")
      .doc(productId)
      .collection("variants")
      .get();
    const variant = variants.docs[0]!;

    // createOrder already triggers sendOrderEmails once.
    const result = await createOrder(
      baseBody([{ variantId: variant.id, productId, qty: 1 }]),
    );

    expect(emailSendStats.confirmation).toBe(1);
    expect(emailSendStats.admin).toBe(1);

    const orderSnap = await db.collection("orders").doc(result.orderId).get();
    const emails = (orderSnap.data() as { emails: { confirmationAt: string; adminAt: string } })
      .emails;
    expect(emails.confirmationAt).toBeTruthy();
    expect(emails.adminAt).toBeTruthy();
    const firstConfirmationAt = emails.confirmationAt;
    const firstAdminAt = emails.adminAt;

    const second = await sendOrderEmails(result.orderId);
    expect(second.confirmation).toBe(false);
    expect(second.admin).toBe(false);
    expect(emailSendStats.confirmation).toBe(1);
    expect(emailSendStats.admin).toBe(1);

    const again = (
      await db.collection("orders").doc(result.orderId).get()
    ).data() as { emails: { confirmationAt: string; adminAt: string } };
    expect(again.emails.confirmationAt).toBe(firstConfirmationAt);
    expect(again.emails.adminAt).toBe(firstAdminAt);
  });
});

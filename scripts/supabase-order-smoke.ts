/**
 * Smoke: POST one COD order to /api/orders (running next dev).
 * Usage: pnpm run:local scripts/supabase-order-smoke.ts
 */
import { E2E_PRODUCT } from "@/lib/shop/seed-e2e";

const base = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";

async function main() {
  const body = {
    email: "buyer@sanem.test",
    delivery: {
      recipient: "Test Buyer",
      address: "Rruga Test 1",
      city: "Prishtinë",
      postalCode: "10000",
      phone: "+38349111111",
      country: "XK",
    },
    billingSameAsDelivery: true,
    billing: {
      recipient: "Test Buyer",
      address: "Rruga Test 1",
      city: "Prishtinë",
      postalCode: "10000",
      phone: "+38349111111",
      country: "XK",
    },
    deliveryMethodId: "kosovo",
    paymentMethodId: "cod",
    newsletterOptIn: false,
    termsAccepted: true,
    turnstileToken: "dev-turnstile-token",
    website: "",
    lines: [
      {
        productId: E2E_PRODUCT.id,
        variantId: E2E_PRODUCT.variantId,
        qty: 1,
      },
    ],
    discountCode: null,
  };

  const res = await fetch(`${base}/api/orders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log("status", res.status);
  console.log(text);
  if (!res.ok) process.exit(1);
  const json = JSON.parse(text) as { orderId?: string; number?: string };
  if (!json.orderId || json.orderId === "honeypot" || !json.number) {
    console.error("unexpected success shape");
    process.exit(1);
  }
  console.log("ok", json.number, json.orderId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

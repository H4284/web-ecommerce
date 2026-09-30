import { expect, test } from "@playwright/test";
import { shopCopy } from "@/content/shop";
import { adminCopy } from "@/content/admin";
import {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
  E2E_PRODUCT,
} from "@/lib/shop/seed-e2e";
import { placeCodOrder } from "./helpers/checkout";
import { getOrderTotal, getVariantStock } from "./helpers/firestore";

test.describe.configure({ mode: "serial" });

test("golden path: browse → cart → COD → thank-you → admin sees order → stock drops", async ({
  page,
}) => {
  const before = await getVariantStock(E2E_PRODUCT.id, E2E_PRODUCT.variantId);

  const { orderNumber } = await placeCodOrder(page);
  expect(orderNumber).toMatch(/^SAN-\d{4}-\d{5}$/);

  const after = await getVariantStock(E2E_PRODUCT.id, E2E_PRODUCT.variantId);
  expect(after.stock).toBe(before.stock - 1);

  await page.goto(`/login?next=${encodeURIComponent("/admin/orders")}`);
  await expect(page.getByTestId("turnstile-dev")).toBeVisible();
  await page.getByLabel(shopCopy.authEmail).fill(E2E_ADMIN_EMAIL);
  await page.getByLabel(shopCopy.authPassword).fill(E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: shopCopy.authLoginSubmit }).click();

  await expect(page).toHaveURL(/\/admin\/orders/, { timeout: 60_000 });
  await expect(page.getByRole("heading", { name: adminCopy.orders })).toBeVisible();
  await expect(page.getByRole("link", { name: orderNumber })).toBeVisible();
});

test("tamper: /api/orders ignores client prices and stores the server total", async ({
  request,
}) => {
  const variant = await getVariantStock(E2E_PRODUCT.id, E2E_PRODUCT.variantId);
  expect(variant.stock).toBeGreaterThan(0);

  const res = await request.post("/api/orders", {
    data: {
      email: "tamper@example.com",
      delivery: {
        country: "XK",
        city: "Prishtinë",
        recipient: "Tamper Test",
        address: "Rruga Tamper 1",
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
      discountCode: null,
      lines: [
        {
          variantId: E2E_PRODUCT.variantId,
          productId: E2E_PRODUCT.id,
          qty: 1,
          // Deliberate client lie — must not become the stored price.
          priceCents: 1,
          totalCents: 1,
        },
      ],
    },
  });

  expect(res.status()).toBe(200);
  const body = (await res.json()) as { orderId: string; number: string };
  expect(body.orderId).toBeTruthy();

  const order = await getOrderTotal(body.orderId);
  expect(order.linePriceCents).toBe(variant.priceCents);
  expect(order.subtotalCents).toBe(variant.priceCents);
  expect(order.totalCents).toBeGreaterThanOrEqual(variant.priceCents);
  // A buggy server that trusted priceCents: 1 would store ~1 (+ delivery).
  expect(order.linePriceCents).not.toBe(1);
  expect(order.totalCents).toBeGreaterThan(100);
});

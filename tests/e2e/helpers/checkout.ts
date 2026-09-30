import { expect, type Page } from "@playwright/test";
import { shopCopy } from "@/content/shop";
import {
  E2E_DISCOUNT_CODE,
  E2E_PRODUCT,
} from "@/lib/shop/seed-e2e";

/** Home → Women → Iris → 100 ml → cart → discount → checkout → thank-you. */
export async function placeCodOrder(page: Page): Promise<{
  orderNumber: string;
  orderId: string;
}> {
  await page.goto("/");
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.reload();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();

  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: E2E_PRODUCT.categoryLabel })
    .click();
  await expect(page).toHaveURL(new RegExp(`/categories/${E2E_PRODUCT.categorySlug}`));

  await page.getByRole("link", { name: new RegExp(E2E_PRODUCT.name) }).first().click();
  await expect(page).toHaveURL(new RegExp(`/products/${E2E_PRODUCT.slug}`));
  await expect(page.getByRole("heading", { level: 1, name: E2E_PRODUCT.name })).toBeVisible();

  await page.getByRole("button", { name: E2E_PRODUCT.variantLabel }).click();
  await page.getByRole("button", { name: shopCopy.addToCart }).click();
  await expect(page.getByText(shopCopy.addToCartToast)).toBeVisible();

  const discountInput = page.locator("#cart-discount-drawer");
  await discountInput.fill(E2E_DISCOUNT_CODE);
  await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().includes("/api/cart/validate") &&
        r.request().method() === "POST" &&
        r.ok(),
    ),
    page.getByRole("button", { name: shopCopy.cartDiscountApply }).click(),
  ]);
  await expect(page.getByText(shopCopy.cartDiscount)).toBeVisible();

  await page.getByRole("link", { name: shopCopy.cartCheckout }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: shopCopy.checkoutTitle })).toBeVisible();

  await page.getByLabel(shopCopy.checkoutEmail, { exact: true }).fill("e2e-buyer@example.com");
  await page.getByLabel(shopCopy.checkoutRecipient, { exact: true }).fill("E2E Buyer");
  await page.getByLabel(shopCopy.checkoutAddress, { exact: true }).fill("Rruga E2E 1");

  const cityInput = page.getByPlaceholder(shopCopy.checkoutCitySearch);
  await cityInput.click();
  await cityInput.fill("Prisht");
  await page
    .getByRole("listbox")
    .getByRole("button", { name: "Prishtinë" })
    .click();
  await expect(cityInput).toHaveValue("Prishtinë");

  await page.getByPlaceholder("+383 49 123 456").fill("+38349111222");
  await page.getByRole("checkbox", { name: /Pranoj kushtet/ }).check();
  await expect(page.getByTestId("turnstile-dev")).toBeVisible();

  // Chromium may autofill the honeypot; clear it or zod fails with no visible error.
  await page
    .locator('form:has(h1) input[name="website"]')
    .evaluate((el) => {
      const input = el as HTMLInputElement;
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

  const orderResponsePromise = page.waitForResponse(
    (r) =>
      r.url().includes("/api/orders") && r.request().method() === "POST",
    { timeout: 30_000 },
  );

  await page.getByRole("button", { name: shopCopy.checkoutSubmit }).click();

  const res = await orderResponsePromise;
  if (!res.ok()) {
    throw new Error(`POST /api/orders failed: ${res.status()} ${await res.text()}`);
  }
  await expect(page).toHaveURL(/\/orders\/[^/]+\/thank-you/, { timeout: 60_000 });

  const orderNumber = (await page.getByText(/^SAN-\d{4}-\d{5}$/).textContent())?.trim();
  if (!orderNumber) throw new Error("Missing order number on thank-you");

  const match = page.url().match(/\/orders\/([^/]+)\/thank-you/);
  const orderId = match?.[1];
  if (!orderId) throw new Error("Missing order id in thank-you URL");

  return { orderNumber, orderId };
}

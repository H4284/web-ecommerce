/** Shared e2e fixtures written by `scripts/seed.ts`. */
export const E2E_ADMIN_EMAIL = "admin@sanem.test";
export const E2E_ADMIN_PASSWORD = "e2e-Admin-Pass1";
export const E2E_DISCOUNT_CODE = "E2E10";

/** First single-axis product in Women (seed index 6). */
export const E2E_PRODUCT = {
  id: "prod-07",
  slug: "iris",
  name: "Iris",
  categorySlug: "women",
  categoryLabel: "Women",
  variantId: "100ml",
  variantLabel: "100 ml",
} as const;

import { describe, expect, it } from "vitest";
import { buildSeedShopSettings } from "@/lib/shop/seed-settings";
import {
  deliveryFeeCents,
  qualifiesForFreeDelivery,
  shopSettingsSchema,
} from "@/lib/shop/settings-schema";

describe("shop settings", () => {
  const settings = buildSeedShopSettings();
  const kosovo = settings.deliveryMethods[0]!;

  it("parses plan seed values", () => {
    expect(settings.orderPrefix).toBe("SAN");
    expect(settings.ordersInbox).toBe("ihthava@gmail.com");
    expect(kosovo.priceCents).toBe(200);
    expect(kosovo.freeOverCents).toBe(5000);
    expect(settings.paymentMethods.find((p) => p.id === "cod")?.active).toBe(true);
    expect(settings.paymentMethods.find((p) => p.id === "bank-card")?.active).toBe(false);
    expect(() => shopSettingsSchema.parse(settings)).not.toThrow();
  });

  it("applies free delivery at exactly the threshold (≥)", () => {
    expect(qualifiesForFreeDelivery(4999, kosovo)).toBe(false);
    expect(deliveryFeeCents(4999, kosovo)).toBe(200);
    expect(qualifiesForFreeDelivery(5000, kosovo)).toBe(true);
    expect(deliveryFeeCents(5000, kosovo)).toBe(0);
    expect(deliveryFeeCents(5001, kosovo)).toBe(0);
  });
});

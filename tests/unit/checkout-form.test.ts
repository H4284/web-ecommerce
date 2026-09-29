import { describe, expect, it } from "vitest";
import { filterCities } from "@/lib/shop/cities";
import {
  isValidKosovoPhone,
  normalizeKosovoPhone,
} from "@/lib/shop/phone";
import { checkoutFormSchema, emptyAddress } from "@/lib/shop/checkout-schema";

describe("Kosovo phone", () => {
  it("accepts +383 49 123 456", () => {
    expect(normalizeKosovoPhone("+383 49 123 456")).toBe("+38349123456");
    expect(isValidKosovoPhone("+383 49 123 456")).toBe(true);
  });

  it("rejects 049123456 without country code", () => {
    expect(normalizeKosovoPhone("049123456")).toBeNull();
    expect(isValidKosovoPhone("049123456")).toBe(false);
  });
});

describe("city filter", () => {
  it("finds Prishtinë when typing Pri", () => {
    const hits = filterCities("Pri");
    expect(hits.some((c) => c === "Prishtinë")).toBe(true);
  });
});

describe("checkoutFormSchema", () => {
  it("rejects a local phone and accepts a normalized one", () => {
    const base = {
      email: "test@example.com",
      delivery: {
        ...emptyAddress(),
        city: "Prishtinë",
        recipient: "Test Test",
        address: "Rruga 1",
        phone: "049123456",
      },
      billingSameAsDelivery: true,
      deliveryMethodId: "kosovo",
      paymentMethodId: "cod" as const,
      newsletterOptIn: false,
      termsAccepted: true,
      website: "",
      turnstileToken: "token",
    };
    expect(checkoutFormSchema.safeParse(base).success).toBe(false);

    const ok = checkoutFormSchema.safeParse({
      ...base,
      delivery: { ...base.delivery, phone: "+383 49 123 456" },
    });
    expect(ok.success).toBe(true);
  });
});

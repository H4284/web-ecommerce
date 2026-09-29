import { describe, expect, it } from "vitest";
import { formatCents, unitPrice } from "@/lib/shop/money";

describe("formatCents", () => {
  it("formats EUR for Kosovo", () => {
    expect(formatCents(2200)).toBe("22,00 €");
  });

  it("rejects non-integer cents", () => {
    expect(() => formatCents(22.5)).toThrow(/integer/);
  });
});

describe("unitPrice", () => {
  it("returns price per unit label", () => {
    expect(unitPrice(600, { amount: 100, label: "g" })).toBe("0,06 €/g");
  });
});

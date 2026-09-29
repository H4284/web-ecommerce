import { describe, expect, it } from "vitest";
import { formatCents } from "@/lib/shop/money";

describe("formatCents", () => {
  it("formats EUR for Kosovo", () => {
    expect(formatCents(2200)).toBe("22,00 €");
  });
});

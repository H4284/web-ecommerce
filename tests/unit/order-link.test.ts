import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { signOrderLink, verifyOrderLink } from "@/lib/shop/order-link";

const PREV = process.env.ORDER_LINK_SECRET;

describe("order-link", () => {
  afterEach(() => {
    if (PREV === undefined) delete process.env.ORDER_LINK_SECRET;
    else process.env.ORDER_LINK_SECRET = PREV;
  });

  it("signs with HMAC-SHA256 and verifies", () => {
    process.env.ORDER_LINK_SECRET = "test-secret";
    const token = signOrderLink("order-1");
    const expected = createHmac("sha256", "test-secret")
      .update("order-1")
      .digest("hex");
    expect(token).toBe(expected);
    expect(verifyOrderLink("order-1", token)).toBe(true);
    expect(verifyOrderLink("order-1", "x".repeat(token.length))).toBe(false);
    expect(verifyOrderLink("order-1", "short")).toBe(false);
  });
});

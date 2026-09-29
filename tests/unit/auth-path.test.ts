import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/shop/auth-path";

describe("safeNextPath", () => {
  it("keeps same-site relative paths", () => {
    expect(safeNextPath("/account")).toBe("/account");
    expect(safeNextPath("/admin?tab=1")).toBe("/admin?tab=1");
  });

  it("rejects open redirects", () => {
    expect(safeNextPath("//evil.test")).toBe("/");
    expect(safeNextPath("https://evil.test")).toBe("/");
    expect(safeNextPath("evil")).toBe("/");
    expect(safeNextPath(null, "/account")).toBe("/account");
  });
});

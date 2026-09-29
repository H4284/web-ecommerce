import { describe, expect, it } from "vitest";
import { IMAGE_WIDTHS, MAX_IMAGE_BYTES, nextImageIndex } from "@/lib/images/widths";

describe("product image index", () => {
  it("picks the next free n and never reuses 0 when present", () => {
    expect(nextImageIndex([])).toBe(0);
    expect(
      nextImageIndex([{ path: "products/p1/0" }, { path: "products/p1/2" }]),
    ).toBe(3);
  });

  it("keeps the four widths and 10 MB limit", () => {
    expect(IMAGE_WIDTHS).toEqual([320, 640, 960, 1280]);
    expect(MAX_IMAGE_BYTES).toBe(10 * 1024 * 1024);
  });
});

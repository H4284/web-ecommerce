import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("a11y landmarks", () => {
  it("keeps the free-delivery bar inside the site header banner", () => {
    const header = readFileSync(
      join(process.cwd(), "components/site/site-header.tsx"),
      "utf8",
    );
    const layout = readFileSync(
      join(process.cwd(), "app/(site)/layout.tsx"),
      "utf8",
    );
    expect(header).toContain("FreeDeliveryBar");
    expect(layout).not.toMatch(/FreeDeliveryBar/);
  });

  it("gives carousels an explicit region role", () => {
    const hero = readFileSync(
      join(process.cwd(), "components/home/hero-slideshow.tsx"),
      "utf8",
    );
    const products = readFileSync(
      join(process.cwd(), "components/home/product-slides.tsx"),
      "utf8",
    );
    expect(hero).toMatch(/role=\"region\"[\s\S]*aria-roledescription=\"carousel\"/);
    expect(products).toMatch(/role=\"region\"[\s\S]*aria-roledescription=\"carousel\"/);
  });
});

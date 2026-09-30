import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HeroBand } from "@/components/home/hero-band";
import { site } from "@/content/site";

describe("HeroBand a11y", () => {
  it("renders a page-level h1 with the brand name", () => {
    const html = renderToStaticMarkup(
      <HeroBand
        slides={[
          {
            id: "demo",
            name: "Demo",
            rightLabel: "Demo",
            href: "/products/demo",
            productImage: null,
          },
        ]}
      />,
    );
    expect(html).toContain("<h1");
    expect(html).toContain(site.name);
    expect(html).toContain(site.tagline);
  });
});

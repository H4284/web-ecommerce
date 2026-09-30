import { describe, expect, it } from "vitest";
import {
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/shop/json-ld";
import { isPrivatePath } from "@/lib/shop/seo-paths";
import { absoluteUrl, siteUrl } from "@/lib/shop/site-url";

describe("site-url", () => {
  it("strips trailing slash and builds absolute paths", () => {
    expect(siteUrl().endsWith("/")).toBe(false);
    expect(absoluteUrl("/")).toMatch(/\/$/);
    expect(absoluteUrl("/products/x")).toContain("/products/x");
  });
});

describe("sitemap private paths", () => {
  it("blocks admin, cart, checkout, account, orders, api, search", () => {
    for (const p of [
      "/admin",
      "/admin/orders",
      "/account",
      "/checkout",
      "/cart",
      "/orders/abc",
      "/api/orders",
      "/search",
    ]) {
      expect(isPrivatePath(p)).toBe(true);
    }
    expect(isPrivatePath("/products/x")).toBe(false);
    expect(isPrivatePath("/categories/women")).toBe(false);
  });
});

describe("json-ld org and website", () => {
  it("emits Organization and WebSite SearchAction", () => {
    const org = organizationJsonLd({
      name: "Sanem",
      url: "https://example.com/",
      email: "a@b.c",
    });
    expect(org["@type"]).toBe("Organization");
    expect(org.name).toBe("Sanem");

    const web = websiteJsonLd({
      name: "Sanem",
      url: "https://example.com/",
      searchUrlTemplate: "https://example.com/search?q={search_term_string}",
    });
    expect(web["@type"]).toBe("WebSite");
    expect(web.potentialAction["@type"]).toBe("SearchAction");
  });
});

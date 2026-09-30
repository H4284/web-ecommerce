import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/shop/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/account",
        "/checkout",
        "/cart",
        "/shporta",
        "/orders",
        "/api",
        "/search",
        "/login",
        "/forgot-password",
        "/dev",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}

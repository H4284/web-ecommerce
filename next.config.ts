import type { NextConfig } from "next";
import { securityHeaderList } from "./lib/shop/security-headers";

const nextConfig: NextConfig = {
  output: "standalone",
  images: { loader: "custom", loaderFile: "./lib/images/loader.ts" },
  experimental: { serverActions: { bodySizeLimit: "11mb" } },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaderList(),
      },
    ];
  },
  async redirects() {
    return [
      // Plan routes → implemented paths (no old public site; aliases only).
      {
        source: "/koleksioni",
        destination: "/categories/perfumes",
        permanent: true,
      },
      {
        source: "/koleksioni/:slug",
        destination: "/products/:slug",
        permanent: true,
      },
      {
        source: "/dergesa-dhe-kthime",
        destination: "/dergesa",
        permanent: true,
      },
      {
        source: "/brands/:slug",
        destination: "/categories/perfumes",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

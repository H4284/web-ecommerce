import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: { loader: "custom", loaderFile: "./lib/images/loader.ts" },
  experimental: { serverActions: { bodySizeLimit: "11mb" } },
};

export default nextConfig;

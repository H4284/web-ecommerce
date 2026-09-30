import imageLoader from "@/lib/images/loader";

/** Absolute URL for the pre-sized WebP used as the home LCP frame. */
export function heroLcpUrl(path: string, width = 640): string {
  return imageLoader({ src: path, width });
}

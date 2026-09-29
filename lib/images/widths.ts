/** Pre-sized WebP widths for product and content images. */
export const IMAGE_WIDTHS = [320, 640, 960, 1280] as const;

export type ImageWidth = (typeof IMAGE_WIDTHS)[number];

/** Max upload size accepted by the server (bytes). */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const IMAGE_CACHE_CONTROL = "public, max-age=31536000, immutable";

/** Next free frame index for `products/<id>/<n>`. Never reuses a cached n. */
export function nextImageIndex(existing: Array<{ path: string }>): number {
  let max = -1;
  for (const img of existing) {
    const match = /\/(\d+)$/.exec(img.path);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return max + 1;
}

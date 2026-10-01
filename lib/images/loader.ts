/** Pre-sized WebP for products/ and content/ via Supabase Storage public URLs. */
import { IMAGE_WIDTHS } from "@/lib/images/widths";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");

export default function loader({ src, width }: { src: string; width: number }) {
  if (!src.startsWith("products/") && !src.startsWith("content/")) return src;
  const w = IMAGE_WIDTHS.find((x) => x >= width) ?? 1280;

  if (!SUPABASE_URL) {
    // Missing env — return path unchanged so next/image still renders alt text.
    return src;
  }

  // DB path `products/{id}/0` → storage object `{id}/0-{w}.webp` in bucket `products`.
  const withoutPrefix = src.replace(/^(products|content)\//, "");
  const objectPath = `${withoutPrefix}-${w}.webp`;
  const bucket = src.startsWith("content/") ? "content" : "products";
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${objectPath}`;
}

import {
  IMAGE_WIDTHS,
} from "@/lib/images/widths";

const ORIGIN =
  process.env.NEXT_PUBLIC_STORAGE_ORIGIN ?? "https://firebasestorage.googleapis.com";
const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

/** Pre-sized WebP for products/ and content/; other src returned as-is. */
export default function loader({ src, width }: { src: string; width: number }) {
  if (!src.startsWith("products/") && !src.startsWith("content/")) return src;
  const w = IMAGE_WIDTHS.find((x) => x >= width) ?? 1280;
  return `${ORIGIN}/v0/b/${BUCKET}/o/${encodeURIComponent(`${src}-${w}.webp`)}?alt=media`;
}

import "server-only";
import { unstable_cache } from "next/cache";
import { getHomeContentUncached } from "@/lib/shop/home-content-queries";

/** Cached home content for the storefront (5 minutes). */
export async function getHomeContent() {
  return unstable_cache(() => getHomeContentUncached(), ["content", "home"], {
    revalidate: 300,
    tags: ["content"],
  })();
}

export type {
  HomeContent,
  HomeHeroSlide,
  HomePromoBlock,
} from "@/lib/shop/home-content-schema";

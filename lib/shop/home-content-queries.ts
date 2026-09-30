import "server-only";
import { db } from "@/lib/firebase/admin";
import {
  HOME_CONTENT_PATH,
  homeContentSchema,
  type HomeContent,
} from "@/lib/shop/home-content-schema";
import { buildSeedHomeContent } from "@/lib/shop/seed-home-content";

/** Uncached read. Missing doc → seed-shaped default (not written). */
export async function getHomeContentUncached(): Promise<HomeContent> {
  const snap = await db
    .collection(HOME_CONTENT_PATH.collection)
    .doc(HOME_CONTENT_PATH.id)
    .get();
  if (!snap.exists) return buildSeedHomeContent();
  const parsed = homeContentSchema.safeParse(snap.data());
  if (!parsed.success) return buildSeedHomeContent();
  return parsed.data;
}

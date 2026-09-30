"use server";

import {
  ImageTooLargeError,
  MAX_IMAGE_BYTES,
  getAdminHomeContent,
  saveAdminHomeContent,
  uploadAdminHomeHeroImage,
} from "@/lib/shop/admin-content";
import type { HomeContent } from "@/lib/shop/home-content-schema";

export type ContentActionResult =
  | { ok: true; content?: HomeContent; path?: string }
  | { ok: false; error: string };

export async function saveHomeContentAction(
  input: unknown,
): Promise<ContentActionResult> {
  try {
    await saveAdminHomeContent(input);
    return { ok: true };
  } catch (err) {
    console.error("[admin] saveHomeContent", err);
    return { ok: false, error: "save_failed" };
  }
}

export async function uploadHomeHeroImageAction(
  formData: FormData,
): Promise<ContentActionResult> {
  try {
    const slideId = String(formData.get("slideId") ?? "");
    const file = formData.get("file");
    if (!slideId || !(file instanceof File)) {
      return { ok: false, error: "invalid" };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: "image_too_large" };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const content = await getAdminHomeContent();
    const result = await uploadAdminHomeHeroImage({
      slideId,
      buffer,
      content,
    });
    return { ok: true, path: result.path, content: result.content };
  } catch (err) {
    if (err instanceof ImageTooLargeError) {
      return { ok: false, error: "image_too_large" };
    }
    console.error("[admin] uploadHomeHero", err);
    return { ok: false, error: "upload_failed" };
  }
}

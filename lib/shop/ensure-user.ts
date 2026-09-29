import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import type { DecodedIdToken } from "firebase-admin/auth";
import { db } from "@/lib/firebase/admin";

/** Creates `users/{uid}` on first sign-in. */
export async function ensureUserDoc(decoded: DecodedIdToken): Promise<void> {
  const ref = db.collection("users").doc(decoded.uid);
  const snap = await ref.get();
  if (snap.exists) return;

  await ref.set({
    email: decoded.email ?? "",
    name: typeof decoded.name === "string" ? decoded.name : "",
    phone: "",
    newsletterOptIn: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

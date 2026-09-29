"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { adminCopy } from "@/content/admin";
import { auth } from "@/lib/firebase/client";

export function AdminSignOutButton() {
  const router = useRouter();

  async function onSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    try {
      await signOut(auth);
    } catch {
      // Cookie cleared; client sign-out is best-effort.
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onSignOut}
      className="min-h-11 w-full px-3 text-left text-sm text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {adminCopy.signOut}
    </button>
  );
}

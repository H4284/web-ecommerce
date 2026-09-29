"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { site } from "@/content/site";

export function SearchButton() {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isMod = event.metaKey || event.ctrlKey;
      if (isMod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        router.push("/search");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <button
      type="button"
      onClick={() => router.push("/search")}
      className="inline-flex size-11 items-center justify-center text-ink transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label={`${site.chrome.search} (${site.chrome.searchShortcut})`}
    >
      <Search className="size-5" aria-hidden />
    </button>
  );
}

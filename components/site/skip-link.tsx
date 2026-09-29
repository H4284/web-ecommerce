import { site } from "@/content/site";

export function SkipLink() {
  return (
    <a
      href="#main"
      className="bg-ink text-surface focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:px-4 focus:py-2 focus:outline-none sr-only focus:not-sr-only"
    >
      {site.chrome.skipToContent}
    </a>
  );
}

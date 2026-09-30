"use client";

import { site } from "@/content/site";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SiteError({ reset }: ErrorProps) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-3xl tracking-display text-ink">
        {site.chrome.notFoundTitle}
      </h1>
      <p className="text-sm text-ink-muted">{site.chrome.notFoundBody}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex min-h-11 items-center justify-center bg-ink px-5 text-sm font-medium text-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {site.chrome.notFoundCta}
      </button>
    </div>
  );
}

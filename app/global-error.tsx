"use client";

import { site } from "@/content/site";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Must render its own `<html>` / `<body>` — keeps `lang` on fatal error pages. */
export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang={site.defaultLocale}>
      <body className="min-h-dvh bg-surface font-sans text-ink antialiased">
        <main
          id="main"
          className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 px-4 text-center"
        >
          <h1 className="text-2xl font-medium tracking-wide">
            {site.chrome.notFoundTitle}
          </h1>
          <p className="text-sm text-ink-muted">{site.chrome.notFoundBody}</p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-2 inline-flex min-h-11 items-center justify-center bg-ink px-5 text-sm font-medium text-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {site.chrome.notFoundCta}
          </button>
        </main>
      </body>
    </html>
  );
}

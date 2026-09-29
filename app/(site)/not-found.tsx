import Link from "next/link";
import { site } from "@/content/site";

export default function SiteNotFound() {
  return (
    <section className="mx-auto flex min-h-[60dvh] max-w-lg flex-col items-start justify-center gap-4 px-4 py-16">
      <p className="font-display text-sm tracking-display text-accent">404</p>
      <h1 className="font-display text-3xl tracking-display text-ink">
        {site.chrome.notFoundTitle}
      </h1>
      <p className="text-ink-muted">{site.chrome.notFoundBody}</p>
      <Link
        href="/"
        className="mt-2 inline-flex min-h-11 items-center bg-accent px-5 text-sm font-medium text-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {site.chrome.notFoundCta}
      </Link>
    </section>
  );
}

import type { Metadata } from "next";
import { kontakt } from "@/content/kontakt";
import { site } from "@/content/site";
import { socialMetadata } from "@/lib/shop/og";
import { absoluteUrl } from "@/lib/shop/site-url";

export const metadata: Metadata = {
  title: kontakt.title,
  description: kontakt.description,
  alternates: { canonical: absoluteUrl("/kontakt") },
  ...socialMetadata({
    title: `${kontakt.title} · ${site.name}`,
    description: kontakt.description,
    path: "/kontakt",
  }),
};

export default function KontaktPage() {
  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-[var(--space-section)] md:px-6">
      <header className="text-center">
        <p className="font-display text-sm tracking-display text-accent">{site.name}</p>
        <h1 className="mt-3 font-display text-3xl tracking-display text-ink md:text-4xl">
          {kontakt.title}
        </h1>
        <p className="mx-auto mt-4 max-w-prose text-base leading-relaxed text-ink-muted md:text-lg">
          {kontakt.intro}
        </p>
      </header>

      <div className="mx-auto mt-10 flex max-w-sm flex-col items-center gap-8 text-center">
        <dl className="w-full space-y-6 text-sm">
          <div>
            <dt className="font-medium text-ink">{kontakt.locationLabel}</dt>
            <dd className="mt-1 text-ink-muted">{kontakt.locationLine}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">{kontakt.whatsappLabel}</dt>
            <dd className="mt-1 text-ink-muted">{kontakt.whatsappDisplay}</dd>
          </div>
        </dl>

        <a
          href={kontakt.ctaHref}
          rel="noopener noreferrer"
          target="_blank"
          className="inline-flex min-h-11 w-full items-center justify-center bg-accent px-5 text-sm font-medium text-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-auto sm:min-w-[12rem]"
        >
          {kontakt.ctaLabel}
        </a>
      </div>
    </article>
  );
}

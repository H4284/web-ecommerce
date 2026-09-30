import type { Metadata } from "next";
import Link from "next/link";
import { faq } from "@/content/faq";
import { site } from "@/content/site";
import { socialMetadata } from "@/lib/shop/og";
import { absoluteUrl } from "@/lib/shop/site-url";

export const metadata: Metadata = {
  title: faq.title,
  description: faq.description,
  alternates: { canonical: absoluteUrl("/pyetje-te-shpeshta") },
  ...socialMetadata({
    title: `${faq.title} · ${site.name}`,
    description: faq.description,
    path: "/pyetje-te-shpeshta",
  }),
};

export default function FaqPage() {
  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-[var(--space-section)] md:px-6">
      <div className="text-center">
        <p className="font-display text-sm tracking-display text-accent">{site.name}</p>
        <h1 className="mt-3 font-display text-3xl tracking-display text-ink md:text-4xl">
          {faq.title}
        </h1>
        <p className="mx-auto mt-4 max-w-prose text-base leading-relaxed text-ink-muted md:text-lg">
          {faq.intro}
        </p>
      </div>

      <div className="mt-12 border-t border-border">
        {faq.items.map((item, index) => (
          <details
            key={item.id}
            name="faq"
            className="border-b border-border"
            {...(index === 0 ? { open: true } : {})}
          >
            <summary className="cursor-pointer list-none py-5 font-display text-xl tracking-display text-ink marker:content-none transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden md:text-2xl">
              {item.question}
            </summary>
            <p className="max-w-prose pb-5 text-base leading-relaxed text-ink-muted">
              {item.answer}
            </p>
          </details>
        ))}
      </div>

      <p className="mt-12 text-center text-sm text-ink-muted">
        {faq.footerHint}{" "}
        <Link
          href={faq.footerCtaHref}
          className="font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {faq.footerCtaLabel}
        </Link>
      </p>
    </article>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getLegalMeta,
  isLegalPlaceholder,
  LEGAL_ALIASES,
  LEGAL_PAGES,
  readLegalMarkdown,
  resolveLegalSlug,
} from "@/lib/shop/legal-pages";
import { LegalProse } from "@/components/shop/legal-prose";
import { site } from "@/content/site";

type PageProps = {
  params: Promise<{ page: string }>;
};

export function generateStaticParams() {
  return [
    ...LEGAL_PAGES.map((p) => ({ page: p.slug })),
    ...Object.keys(LEGAL_ALIASES).map((page) => ({ page })),
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { page } = await params;
  const slug = resolveLegalSlug(page);
  if (!slug) return { title: site.chrome.notFoundTitle };
  const meta = getLegalMeta(slug);
  const markdown = readLegalMarkdown(slug);
  return {
    title: meta.title,
    description: `${meta.title} — ${site.name}`,
    robots: isLegalPlaceholder(markdown) ? { index: false, follow: false } : undefined,
  };
}

export default async function LegalPage({ params }: PageProps) {
  const { page } = await params;
  const slug = resolveLegalSlug(page);
  if (!slug) notFound();

  const markdown = readLegalMarkdown(slug);
  const meta = getLegalMeta(slug);

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-[var(--space-section)] md:px-6">
      <LegalProse markdown={markdown} />
      {isLegalPlaceholder(markdown) ? (
        <p className="sr-only">
          Placeholder page for {meta.title}. Client-approved copy is pending.
        </p>
      ) : null}
    </article>
  );
}

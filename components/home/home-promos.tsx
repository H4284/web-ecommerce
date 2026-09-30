import Link from "next/link";
import type { HomePromoBlock } from "@/lib/shop/home-content-schema";

type HomePromosProps = {
  blocks: HomePromoBlock[];
};

export function HomePromos({ blocks }: HomePromosProps) {
  if (blocks.length === 0) return null;

  return (
    <section
      className="border-y border-border bg-surface px-4 py-[var(--space-16)]"
      aria-label="Promo"
    >
      <ul className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
        {blocks.map((block) => (
          <li key={block.id} className="flex flex-col gap-2">
            <h2 className="font-display text-2xl tracking-display text-ink">
              {block.title}
            </h2>
            {block.body ? (
              <p className="text-sm text-ink-muted">{block.body}</p>
            ) : null}
            {block.link ? (
              <Link
                href={block.link}
                className="mt-auto text-sm text-ink underline-offset-4 hover:underline"
              >
                →
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

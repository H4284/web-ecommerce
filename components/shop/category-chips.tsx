import Link from "next/link";
import { cn } from "cn";

export type CategoryChip = {
  slug: string;
  name: string;
};

type CategoryChipsProps = {
  chips: CategoryChip[];
  activeSlug: string;
  className?: string;
};

export function CategoryChips({ chips, activeSlug, className }: CategoryChipsProps) {
  if (chips.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((chip) => {
        const active = chip.slug === activeSlug;
        return (
          <li key={chip.slug}>
            <Link
              href={`/categories/${chip.slug}`}
              className={cn(
                "inline-flex min-h-11 items-center px-4 text-sm transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                active
                  ? "bg-ink text-on-accent"
                  : "bg-surface-2 text-ink hover:bg-accent-soft",
              )}
              aria-current={active ? "page" : undefined}
            >
              {chip.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

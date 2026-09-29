import Link from "next/link";
import { shopCopy } from "@/content/shop";
import { cn } from "cn";

type PaginationProps = {
  basePath: string;
  page: number;
  pageCount: number;
  sort?: string;
  className?: string;
};

function hrefFor(basePath: string, page: number, sort?: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (sort && sort !== "newest") params.set("sort", sort);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({
  basePath,
  page,
  pageCount,
  sort,
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < pageCount ? page + 1 : null;

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-4 pt-[var(--space-8)]", className)}
    >
      {prev ? (
        <Link
          href={hrefFor(basePath, prev, sort)}
          className="min-h-11 px-3 text-sm text-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {shopCopy.paginationPrev}
        </Link>
      ) : (
        <span className="min-h-11 px-3 text-sm text-ink-muted/50" aria-disabled>
          {shopCopy.paginationPrev}
        </span>
      )}

      <p className="text-sm text-ink-muted" aria-live="polite">
        {shopCopy.paginationPage} {page} / {pageCount}
      </p>

      {next ? (
        <Link
          href={hrefFor(basePath, next, sort)}
          className="min-h-11 px-3 text-sm text-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {shopCopy.paginationNext}
        </Link>
      ) : (
        <span className="min-h-11 px-3 text-sm text-ink-muted/50" aria-disabled>
          {shopCopy.paginationNext}
        </span>
      )}
    </nav>
  );
}

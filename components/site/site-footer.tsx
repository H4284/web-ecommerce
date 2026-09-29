import Link from "next/link";
import type { NavCategory } from "@/lib/shop/nav";
import { site } from "@/content/site";

type SiteFooterProps = {
  categories: NavCategory[];
};

export function SiteFooter({ categories }: SiteFooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border bg-surface-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="font-display text-2xl tracking-display text-ink">{site.name}</p>
          <p className="mt-2 max-w-xs text-sm text-ink-muted">{site.tagline}</p>
          <p className="mt-4 text-sm text-ink-muted">
            {site.city}, {site.country}
          </p>
          <a
            href={site.primaryCta.href}
            rel="noopener noreferrer"
            target="_blank"
            className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            {site.primaryCta.label}
          </a>
        </div>
        <div>
          <p className="text-sm font-medium text-ink">{site.footer.categoriesHeading}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {categories.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-ink-muted hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-ink">{site.footer.helpHeading}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {site.footer.helpLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-ink-muted hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-ink">{site.footer.legalHeading}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {site.footer.legalLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-ink-muted hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-ink-muted">
        © {year} {site.name}
      </div>
    </footer>
  );
}

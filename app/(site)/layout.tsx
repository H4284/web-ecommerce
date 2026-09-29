import Link from "next/link";
import { site } from "@/content/site";

export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-[var(--header-height)] items-center justify-between border-b border-border px-4">
        <Link href="/" className="font-display text-xl tracking-display text-ink">
          {site.name}
        </Link>
        <a
          href={site.primaryCta.href}
          className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
          rel="noopener"
        >
          {site.primaryCta.label}
        </a>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border px-4 py-6 text-sm text-ink-muted">
        © {new Date().getFullYear()} {site.name}
      </footer>
    </div>
  );
}

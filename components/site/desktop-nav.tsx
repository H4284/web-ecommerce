"use client";

import Link from "next/link";
import { useState } from "react";
import type { NavCategory } from "@/lib/shop/nav";
import { site } from "@/content/site";
import { cn } from "cn";

type DesktopNavProps = {
  categories: NavCategory[];
};

export function DesktopNav({ categories }: DesktopNavProps) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  return (
    <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
      {categories.map((item) =>
        item.children.length > 0 ? (
          <div
            key={item.href}
            className="relative"
            onMouseEnter={() => setOpenSlug(item.href)}
            onMouseLeave={() => setOpenSlug(null)}
          >
            <Link
              href={item.href}
              className="text-sm text-ink transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-expanded={openSlug === item.href}
              aria-haspopup="true"
            >
              {item.label}
            </Link>
            <div
              className={cn(
                "absolute top-full left-0 z-40 min-w-48 border border-border bg-surface py-3 shadow-sm",
                openSlug === item.href ? "block" : "hidden",
              )}
            >
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block px-4 py-2 text-sm text-ink hover:bg-surface-2 hover:text-accent"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm text-ink transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {item.label}
          </Link>
        ),
      )}
      {site.nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

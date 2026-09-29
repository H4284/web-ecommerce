"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import type { NavCategory } from "@/lib/shop/nav";
import { site } from "@/content/site";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type MobileNavProps = {
  categories: NavCategory[];
};

export function MobileNav({ categories }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="inline-flex size-11 items-center justify-center text-ink lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={site.chrome.openMenu}
        aria-expanded={open}
        aria-controls="mobile-nav"
      >
        <Menu className="size-5" aria-hidden />
      </SheetTrigger>
      <SheetContent
        id="mobile-nav"
        side="left"
        className="w-[min(100%,20rem)] gap-0 bg-surface p-0"
      >
        <SheetHeader className="border-b border-border px-4 py-5">
          <SheetTitle className="font-display text-xl tracking-display text-ink">
            {site.name}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-4" aria-label="Mobile">
          {categories.map((item) => (
            <div key={item.href} className="flex flex-col gap-1">
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="min-h-11 px-2 py-2 text-base text-ink hover:text-accent"
              >
                {item.label}
              </Link>
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={() => setOpen(false)}
                  className="min-h-11 px-4 py-2 text-sm text-ink-muted hover:text-ink"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          ))}
          <div className="my-3 border-t border-border" />
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="min-h-11 px-2 py-2 text-base text-ink hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={site.primaryCta.href}
            rel="noopener noreferrer"
            target="_blank"
            onClick={() => setOpen(false)}
            className="mt-4 inline-flex min-h-11 items-center justify-center bg-accent px-4 text-sm font-medium text-on-accent"
          >
            {site.primaryCta.label}
          </a>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

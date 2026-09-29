import Link from "next/link";
import type { NavCategory } from "@/lib/shop/nav";
import type { ShopUser } from "@/lib/shop/auth-types";
import { site } from "@/content/site";
import { SearchDialog } from "@/components/shop/search-dialog";
import { AuthMenu } from "@/components/site/auth-menu";
import { CartButton } from "@/components/site/cart-button";
import { DesktopNav } from "@/components/site/desktop-nav";
import { MobileNav } from "@/components/site/mobile-nav";

type SiteHeaderProps = {
  categories: NavCategory[];
  user: ShopUser | null;
};

export function SiteHeader({ categories, user }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[var(--header-height)] max-w-6xl items-center gap-4 px-4">
        <MobileNav categories={categories} />
        <Link
          href="/"
          className="font-display text-2xl tracking-display text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {site.name}
        </Link>
        <div className="flex-1">
          <DesktopNav categories={categories} />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <SearchDialog />
          <AuthMenu user={user} />
          <CartButton />
        </div>
      </div>
    </header>
  );
}

import { getCategoryTree } from "@/lib/shop/catalog";
import { getShopSettings } from "@/lib/shop/settings";
import { categoryNavItems } from "@/lib/shop/nav";
import { FreeDeliveryBar } from "@/components/site/free-delivery-bar";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SkipLink } from "@/components/site/skip-link";

export const dynamic = "force-dynamic";

async function loadChrome() {
  try {
    const [tree, settings] = await Promise.all([getCategoryTree(), getShopSettings()]);
    const kosovo = settings.deliveryMethods.find((m) => m.id === "kosovo" && m.active);
    return {
      categories: categoryNavItems(tree),
      freeOverCents: kosovo?.freeOverCents ?? null,
    };
  } catch (err) {
    console.error("[shell] chrome data unavailable:", err);
    return { categories: [], freeOverCents: null as number | null };
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { categories, freeOverCents } = await loadChrome();

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <FreeDeliveryBar freeOverCents={freeOverCents} />
      <SiteHeader categories={categories} cartCount={0} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter categories={categories} />
    </div>
  );
}

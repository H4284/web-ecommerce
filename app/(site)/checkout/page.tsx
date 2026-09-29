import type { Metadata } from "next";
import { CheckoutPageClient } from "@/components/shop/checkout-page-client";
import { shopCopy } from "@/content/shop";
import { site } from "@/content/site";
import { getShopSettings } from "@/lib/shop/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: shopCopy.checkoutTitle,
  description: `${shopCopy.checkoutTitle} · ${site.name}`,
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const settings = await getShopSettings();
  const kosovo = settings.deliveryMethods.find((m) => m.id === "kosovo" && m.active);

  return (
    <CheckoutPageClient
      deliveryMethods={settings.deliveryMethods}
      paymentMethods={settings.paymentMethods}
      freeOverCents={kosovo?.freeOverCents ?? null}
    />
  );
}

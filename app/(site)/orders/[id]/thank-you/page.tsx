import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThankYouView } from "@/components/shop/thank-you-view";
import { shopCopy } from "@/content/shop";
import { site } from "@/content/site";
import { verifyOrderLink } from "@/lib/shop/order-link";
import { getOrderForThankYou } from "@/lib/shop/order-queries";
import { getShopSettingsUncached } from "@/lib/shop/settings-queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: shopCopy.thankYouTitle,
  description: `${shopCopy.thankYouHeading} · ${site.name}`,
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function ThankYouPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { t } = await searchParams;

  if (!verifyOrderLink(id, t)) {
    notFound();
  }

  const order = await getOrderForThankYou(id);
  if (!order) {
    notFound();
  }

  const settings = await getShopSettingsUncached();

  return <ThankYouView order={order} company={settings.company} />;
}

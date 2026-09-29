import type { Metadata } from "next";
import { CartPageClient } from "@/components/shop/cart-page-client";
import { shopCopy } from "@/content/shop";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: shopCopy.cartTitle,
  description: `${shopCopy.cartTitle} · ${site.name}`,
};

export default function CartPage() {
  return <CartPageClient />;
}

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { site } from "@/content/site";

type CartButtonProps = {
  count?: number;
};

export function CartButton({ count = 0 }: CartButtonProps) {
  const label =
    count > 0 ? `${site.chrome.cart} (${count})` : site.chrome.cart;
  return (
    <Link
      href="/shporta"
      className="relative inline-flex size-11 items-center justify-center text-ink transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label={label}
    >
      <ShoppingBag className="size-5" aria-hidden />
      <span
        className="absolute top-1.5 right-1.5 flex min-w-4 items-center justify-center rounded-sm bg-accent px-1 text-[0.65rem] leading-4 font-medium text-on-accent"
        aria-hidden
      >
        {count}
      </span>
    </Link>
  );
}

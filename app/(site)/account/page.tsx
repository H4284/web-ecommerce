import type { Metadata } from "next";
import Link from "next/link";
import { shopCopy } from "@/content/shop";
import { site } from "@/content/site";
import { requireUser } from "@/lib/shop/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: shopCopy.authAccountHeading,
  description: `${shopCopy.authAccountHeading} · ${site.name}`,
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await requireUser("/account");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl tracking-display text-ink md:text-4xl">
        {shopCopy.authAccountHeading}
      </h1>
      <p className="mt-3 text-ink-muted">
        {shopCopy.authAccountSignedInAs}{" "}
        <span className="font-medium text-ink">{user.email ?? user.uid}</span>
      </p>
      {user.admin ? (
        <Link
          href="/admin"
          className="mt-6 inline-flex min-h-11 items-center justify-center bg-ink px-5 text-sm font-medium text-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {shopCopy.authAdmin}
        </Link>
      ) : null}
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/shop/login-form";
import { shopCopy } from "@/content/shop";
import { site } from "@/content/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: shopCopy.authLoginTitle,
  description: `${shopCopy.authLoginTitle} · ${site.name}`,
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-center font-display text-3xl tracking-display text-ink md:text-4xl">
        {shopCopy.authLoginTitle}
      </h1>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

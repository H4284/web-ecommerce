import Link from "next/link";
import { site } from "@/content/site";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-start justify-center gap-4 px-4">
      <h1 className="font-display text-3xl tracking-display text-ink">404</h1>
      <p className="text-ink-muted">This page is not here.</p>
      <Link href="/" className="text-accent underline-offset-4 hover:underline">
        Back to {site.name}
      </Link>
    </main>
  );
}

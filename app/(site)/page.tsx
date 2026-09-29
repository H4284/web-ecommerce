import { site } from "@/content/site";

export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-16">
      <p className="font-display text-4xl tracking-display text-ink">{site.name}</p>
      <p className="text-ink-muted">{site.tagline}</p>
      <p className="text-sm text-ink-muted">
        Scaffold placeholder. Next:{" "}
        <code className="text-ink">/build shop:catalog-model</code>
      </p>
    </section>
  );
}

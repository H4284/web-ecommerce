import { homeTrust } from "@/content/home";

/**
 * Trust accordion — three pillars, one open at a time.
 * Native `<details name>` keeps exclusive open without client JS.
 */
export function TrustAccordion() {
  return (
    <section
      className="flex min-h-[calc(100dvh-var(--site-top-offset))] items-center bg-ink px-4 py-[var(--space-section)] text-on-accent md:px-[5vw]"
      aria-label={homeTrust.label}
    >
      <div className="mx-auto flex w-full max-w-[var(--trust-max)] flex-col items-center justify-center gap-[var(--trust-gap)]">
        {homeTrust.pillars.map((pillar, index) => (
          <details
            key={pillar.id}
            name="home-trust"
            className="trust-pillar w-full text-center"
            {...(index === 0 ? { open: true } : {})}
          >
            <summary className="cursor-pointer list-none font-display text-[length:var(--trust-title-size)] leading-[1.1] tracking-display text-balance transition-opacity duration-[var(--duration-fast)] ease-[var(--ease-out)] marker:content-none [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-accent">
              <span className="sr-only">{index + 1}. </span>
              {pillar.title}
            </summary>
            <p className="trust-pillar-body mx-auto mt-[var(--space-5)] max-w-[var(--trust-body-max)] text-left text-base leading-relaxed text-on-accent/85 md:text-lg">
              {pillar.body}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

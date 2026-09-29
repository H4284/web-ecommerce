import { homeStory } from "@/content/home";

export function StoryManifesto() {
  return (
    <section
      className="relative overflow-hidden bg-ink px-4 py-[var(--space-section)] text-on-accent md:py-[var(--space-section-loose)]"
      aria-labelledby="story-manifesto-title"
    >
      <p
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 z-0 -translate-x-1/2 translate-y-[18%] select-none font-display text-[length:var(--story-decor-size)] leading-none tracking-display text-on-accent/10"
      >
        {homeStory.decorWord}
      </p>

      <div className="relative z-10 mx-auto flex w-full max-w-none flex-col items-center gap-[var(--space-8)]">
        <h2
          id="story-manifesto-title"
          className="w-full max-w-[var(--story-title-max)] text-center font-display text-3xl tracking-display text-balance md:text-5xl"
        >
          {homeStory.headline}
        </h2>

        <div className="flex w-full max-w-[var(--story-body-max)] flex-col gap-[var(--space-5)] text-left md:w-[62%]">
          {homeStory.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="text-base leading-relaxed text-on-accent/90 md:text-lg">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

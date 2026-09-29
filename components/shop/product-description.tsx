import Markdown from "react-markdown";
import { shopCopy } from "@/content/shop";

type ProductDescriptionProps = {
  markdown: string;
};

export function ProductDescription({ markdown }: ProductDescriptionProps) {
  if (!markdown.trim()) return null;

  return (
    <section className="mt-[var(--space-10)]" aria-labelledby="product-description">
      <h2
        id="product-description"
        className="mb-[var(--space-4)] font-display text-2xl tracking-display"
      >
        {shopCopy.descriptionHeading}
      </h2>
      <div className="prose-shop max-w-none text-base leading-relaxed text-ink [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:tracking-display [&_p]:mb-3 [&_p]:text-ink-muted [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-accent [&_a]:underline">
        <Markdown
          allowedElements={["p", "h1", "h2", "h3", "ul", "ol", "li", "strong", "em", "a"]}
          unwrapDisallowed
          skipHtml
        >
          {markdown}
        </Markdown>
      </div>
    </section>
  );
}

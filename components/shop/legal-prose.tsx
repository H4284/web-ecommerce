import Markdown from "react-markdown";
import { cn } from "cn";

type LegalProseProps = {
  markdown: string;
  className?: string;
};

export function LegalProse({ markdown, className }: LegalProseProps) {
  return (
    <div
      className={cn(
        "max-w-3xl text-base leading-relaxed text-ink",
        "[&_blockquote]:mb-6 [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:bg-accent-soft/40 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-sm [&_blockquote]:text-ink",
        "[&_h1]:mb-4 [&_h1]:font-display [&_h1]:text-3xl [&_h1]:tracking-display md:[&_h1]:text-4xl",
        "[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:tracking-display",
        "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-display [&_h3]:text-xl [&_h3]:tracking-display",
        "[&_p]:mb-3 [&_p]:text-ink-muted",
        "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-ink-muted",
        "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-ink-muted",
        "[&_a]:text-accent [&_a]:underline [&_strong]:text-ink",
        className,
      )}
    >
      <Markdown
        allowedElements={[
          "p",
          "h1",
          "h2",
          "h3",
          "ul",
          "ol",
          "li",
          "strong",
          "em",
          "a",
          "blockquote",
        ]}
        unwrapDisallowed
        skipHtml
      >
        {markdown}
      </Markdown>
    </div>
  );
}

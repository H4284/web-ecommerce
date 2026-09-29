import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const LEGAL_PAGES = [
  { slug: "rreth-nesh", title: "Rreth nesh" },
  { slug: "dergesa", title: "Dorëzimi" },
  { slug: "kthime", title: "Kthimet" },
  { slug: "privatesia", title: "Privatësia" },
  { slug: "kushtet", title: "Kushtet" },
] as const;

export type LegalSlug = (typeof LEGAL_PAGES)[number]["slug"];

const SLUG_SET = new Set<string>(LEGAL_PAGES.map((p) => p.slug));

/** Old combined URL from the sitemap — serves the delivery page. */
export const LEGAL_ALIASES: Record<string, LegalSlug> = {
  "dergesa-dhe-kthime": "dergesa",
};

export function resolveLegalSlug(param: string): LegalSlug | null {
  if (SLUG_SET.has(param)) return param as LegalSlug;
  return LEGAL_ALIASES[param] ?? null;
}

export function getLegalMeta(slug: LegalSlug) {
  return LEGAL_PAGES.find((p) => p.slug === slug)!;
}

export function readLegalMarkdown(slug: LegalSlug): string {
  const path = join(process.cwd(), "content", "pages", `${slug}.md`);
  if (!existsSync(path)) {
    return [
      "> **Placeholder** — client-approved text is not in the repo yet.",
      "",
      `# ${getLegalMeta(slug).title}`,
      "",
      "This page is waiting for approved copy from the Content checklist.",
    ].join("\n");
  }
  return readFileSync(path, "utf8");
}

export function isLegalPlaceholder(markdown: string): boolean {
  return /placeholder/i.test(markdown.slice(0, 400));
}

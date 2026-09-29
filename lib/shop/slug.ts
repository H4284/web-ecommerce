const ALBANIAN: Record<string, string> = {
  ë: "e",
  Ë: "e",
  ç: "c",
  Ç: "c",
};

/** Lowercase slug: a-z 0-9 hyphens only. Albanian ë→e, ç→c. */
export function slugify(input: string): string {
  const mapped = [...input]
    .map((ch) => ALBANIAN[ch] ?? ch)
    .join("")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  return mapped;
}

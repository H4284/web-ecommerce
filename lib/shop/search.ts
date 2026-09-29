const DIACRITICS = /[\u0300-\u036f]/g;

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(DIACRITICS, "");
}

/**
 * Search tokens: lowercase prefixes (2–15 chars) of every word in name and brand.
 * Diacritics removed. Albanian letters folded via NFD.
 */
export function searchTokens(name: string, brand?: string | null): string[] {
  const words = `${name} ${brand ?? ""}`
    .split(/[^a-zA-Z0-9ëËçÇ]+/u)
    .map((w) => stripDiacritics(w).toLowerCase())
    .map((w) => w.replace(/[^a-z0-9]/g, ""))
    .filter((w) => w.length >= 2);

  const tokens = new Set<string>();
  for (const word of words) {
    const max = Math.min(word.length, 15);
    for (let len = 2; len <= max; len++) {
      tokens.add(word.slice(0, len));
    }
  }
  return [...tokens].sort();
}

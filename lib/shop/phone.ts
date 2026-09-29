/**
 * Kosovo mobile/landline: country code +383 and exactly 8 subscriber digits.
 * Accepts spaces and dashes; rejects local-only numbers like 049123456.
 */
export function normalizeKosovoPhone(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Must start with +383 (optional spaces right after +)
  const withPlus = trimmed.replace(/^\+\s*/, "+");
  if (!withPlus.startsWith("+383")) return null;

  const digits = withPlus.slice(1).replace(/\D/g, "");
  // 383 + 8 digits
  if (!/^383\d{8}$/.test(digits)) return null;

  return `+${digits.slice(0, 3)}${digits.slice(3)}`;
}

export function isValidKosovoPhone(input: string): boolean {
  return normalizeKosovoPhone(input) != null;
}

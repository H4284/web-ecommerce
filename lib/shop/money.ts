import type { ProductUnit } from "@/lib/shop/schemas";

/** Format integer cents as EUR for Kosovo (e.g. 2200 → "22,00 €"). */
export function formatCents(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error("formatCents: cents must be an integer");
  }
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  // Narrow no-break space before € — same as Intl sq-XK.
  const body = `${whole},${frac}\u00a0€`;
  return negative ? `-${body}` : body;
}

/**
 * Unit price for a pack priced at `priceCents` covering `unit.amount` of `unit.label`.
 * Integer maths only. Example: 2200 cents for 100 g → "0,22 €/g".
 */
export function unitPrice(priceCents: number, unit: ProductUnit): string {
  if (!Number.isInteger(priceCents)) {
    throw new Error("unitPrice: cents must be an integer");
  }
  if (!Number.isFinite(unit.amount) || unit.amount <= 0) {
    throw new Error("unitPrice: amount must be a positive number");
  }
  const perUnitCents = Math.round(priceCents / unit.amount);
  return `${formatCents(perUnitCents)}/${unit.label}`;
}

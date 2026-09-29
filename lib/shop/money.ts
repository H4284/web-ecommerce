/** Format integer cents as EUR for Kosovo (e.g. 2200 → "22,00 €"). */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("sq-XK", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

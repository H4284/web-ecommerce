import type { ProductOption, Variant } from "@/lib/shop/schemas";

export type OptionSelection = Record<string, string>;

/** Find the variant that matches every selected option value. */
export function findVariant<T extends Variant>(
  variants: T[],
  selection: OptionSelection,
  optionNames: string[],
): T | null {
  return (
    variants.find((variant) =>
      optionNames.every((name) => variant.optionValues[name] === selection[name]),
    ) ?? null
  );
}

/** True when some variant has this axis value and still matches the other selected values. */
export function isOptionValueAvailable<T extends Variant>(
  variants: T[],
  optionName: string,
  value: string,
  selection: OptionSelection,
): boolean {
  return variants.some((variant) => {
    if (variant.optionValues[optionName] !== value) return false;
    return Object.entries(selection).every(([name, selected]) => {
      if (name === optionName) return true;
      return variant.optionValues[name] === selected;
    });
  });
}

/** Initial selection from a SKU, else the default variant, else the first variant. */
export function initialSelectionFromSku<T extends Variant & { id: string }>(
  variants: T[],
  options: ProductOption[],
  sku: string | undefined | null,
  defaultVariantId: string | null,
): { selection: OptionSelection; variant: T | null } {
  const optionNames = options.map((o) => o.name);
  const bySku = sku ? variants.find((v) => v.sku === sku) : undefined;
  const byDefault = defaultVariantId
    ? variants.find((v) => v.id === defaultVariantId || v.isDefault)
    : variants.find((v) => v.isDefault);
  const variant = bySku ?? byDefault ?? variants[0] ?? null;
  if (!variant) return { selection: {}, variant: null };

  const selection: OptionSelection = {};
  for (const name of optionNames) {
    const value = variant.optionValues[name];
    if (value) selection[name] = value;
  }
  return { selection, variant };
}

/** Title suffix: "50 ml / EDP". */
export function variantTitleSuffix(
  options: ProductOption[],
  selection: OptionSelection,
): string {
  return options
    .map((o) => selection[o.name])
    .filter(Boolean)
    .join(" / ");
}

export function variantLabel(
  options: ProductOption[],
  variant: Pick<Variant, "optionValues">,
): string {
  return options
    .map((o) => variant.optionValues[o.name])
    .filter(Boolean)
    .join(" / ");
}

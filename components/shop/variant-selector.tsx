"use client";

import type { ProductOption } from "@/lib/shop/schemas";
import { isOptionValueAvailable, type OptionSelection } from "@/lib/shop/variants";
import type { VariantDoc } from "@/lib/shop/catalog-queries";
import { shopCopy } from "@/content/shop";
import { cn } from "cn";

type VariantSelectorProps = {
  options: ProductOption[];
  variants: VariantDoc[];
  selection: OptionSelection;
  onChange: (optionName: string, value: string) => void;
};

function optionLabel(name: string) {
  return shopCopy.optionLabels[name] ?? name;
}

export function VariantSelector({
  options,
  variants,
  selection,
  onChange,
}: VariantSelectorProps) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-col gap-[var(--space-5)]">
      {options.map((option) => (
        <fieldset key={option.name} className="min-w-0">
          <legend className="mb-2 text-sm text-ink-muted">{optionLabel(option.name)}</legend>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const available = isOptionValueAvailable(
                variants,
                option.name,
                value,
                selection,
              );
              const selected = selection[option.name] === value;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!available}
                  aria-pressed={selected}
                  onClick={() => onChange(option.name, value)}
                  className={cn(
                    "min-h-11 min-w-11 px-4 text-sm transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    selected
                      ? "bg-ink text-on-accent"
                      : "border border-border bg-surface text-ink hover:bg-surface-2",
                    !available && "cursor-not-allowed opacity-40 hover:bg-surface",
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

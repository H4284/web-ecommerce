import { formatCents, unitPrice } from "@/lib/shop/money";
import type { ProductUnit } from "@/lib/shop/schemas";
import { shopCopy } from "@/content/shop";
import { cn } from "cn";

type PriceProps = {
  priceCents: number;
  compareAtCents?: number | null;
  unit?: ProductUnit | null;
  /** Prefix with "Nga:" when the product has a price range. */
  from?: boolean;
  className?: string;
};

export function Price({
  priceCents,
  compareAtCents,
  unit,
  from = false,
  className,
}: PriceProps) {
  const showCompare =
    typeof compareAtCents === "number" && compareAtCents > priceCents;

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <p className="flex flex-wrap items-baseline gap-2 text-sm text-ink">
        {from ? <span className="text-ink-muted">{shopCopy.fromPrice}</span> : null}
        <span className="font-medium">{formatCents(priceCents)}</span>
        {showCompare ? (
          <span className="text-ink-muted line-through">{formatCents(compareAtCents)}</span>
        ) : null}
      </p>
      {unit ? (
        <p className="text-xs text-ink-muted">{unitPrice(priceCents, unit)}</p>
      ) : null}
    </div>
  );
}

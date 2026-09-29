import { shopCopy } from "@/content/shop";
import { cn } from "cn";

type StockBadgeProps = {
  inStock: boolean;
  className?: string;
};

export function StockBadge({ inStock, className }: StockBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-sm px-2 py-0.5 text-xs",
        inStock
          ? "bg-accent-soft text-ink-muted"
          : "bg-surface-2 text-ink-muted",
        className,
      )}
    >
      {inStock ? shopCopy.inStock : shopCopy.outOfStock}
    </span>
  );
}

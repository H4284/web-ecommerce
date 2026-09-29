import { formatCents } from "@/lib/shop/money";
import { site } from "@/content/site";

type FreeDeliveryBarProps = {
  freeOverCents: number | null;
};

export function FreeDeliveryBar({ freeOverCents }: FreeDeliveryBarProps) {
  if (freeOverCents == null) return null;
  return (
    <div className="border-b border-border bg-surface-2 px-4 py-2 text-center text-sm text-ink">
      {site.chrome.freeDeliveryPrefix} {formatCents(freeOverCents)}
    </div>
  );
}

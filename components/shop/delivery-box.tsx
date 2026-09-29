import { formatCents } from "@/lib/shop/money";
import { shopCopy } from "@/content/shop";

type DeliveryBoxProps = {
  feeCents: number;
  freeOverCents: number | null;
  days: string;
  codLabel: string;
};

export function DeliveryBox({
  feeCents,
  freeOverCents,
  days,
  codLabel,
}: DeliveryBoxProps) {
  return (
    <aside
      className="border border-border bg-surface-2 px-4 py-3 text-sm text-ink"
      aria-label={shopCopy.deliveryHeading}
    >
      <p className="mb-2 font-medium">{shopCopy.deliveryHeading}</p>
      <ul className="flex flex-col gap-1 text-ink-muted">
        <li>
          {shopCopy.deliveryFee}: {formatCents(feeCents)}
        </li>
        {freeOverCents != null ? (
          <li>
            {shopCopy.deliveryFreeOver} {formatCents(freeOverCents)}
          </li>
        ) : null}
        <li>
          {shopCopy.deliveryTime}: {days}
        </li>
        <li>{codLabel}</li>
      </ul>
    </aside>
  );
}

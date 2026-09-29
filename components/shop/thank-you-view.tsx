import Link from "next/link";
import { shopCopy } from "@/content/shop";
import { formatCents } from "@/lib/shop/money";
import {
  emailCopy,
  formatAddress,
  paymentInstructions,
  type OrderEmailModel,
} from "@/lib/shop/order-email-model";
import type { ThankYouOrder } from "@/lib/shop/order-queries";
import { PurchaseTracker } from "@/components/shop/purchase-tracker";

type ThankYouViewProps = {
  order: ThankYouOrder;
  company: OrderEmailModel["company"];
};

function toEmailModel(
  order: ThankYouOrder,
  company: OrderEmailModel["company"],
): OrderEmailModel {
  return {
    orderId: order.id,
    number: order.number,
    status: order.status,
    paymentMethodId: order.paymentMethodId,
    paymentStatus: order.paymentStatus,
    lines: order.lines.map((l) => ({
      name: l.name,
      variantLabel: l.variantLabel,
      sku: l.sku,
      qty: l.qty,
      priceCents: l.priceCents,
    })),
    subtotalCents: order.subtotalCents,
    discountAmountCents: order.discountAmountCents,
    deliveryCents: order.deliveryCents,
    totalCents: order.totalCents,
    delivery: order.delivery,
    customerEmail: order.customer.email,
    customerName: order.customer.name,
    company,
  };
}

export function ThankYouView({ order, company }: ThankYouViewProps) {
  const model = toEmailModel(order, company);
  const paymentText = paymentInstructions(model);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PurchaseTracker order={order} />

      <p className="text-sm text-ink-muted">{shopCopy.thankYouTitle}</p>
      <h1 className="mt-1 font-display text-3xl tracking-display text-ink md:text-4xl">
        {shopCopy.thankYouHeading}
      </h1>
      <p className="mt-3 text-ink">
        {shopCopy.thankYouOrderNumber}:{" "}
        <span className="font-medium">{order.number}</span>
      </p>
      <p className="mt-2 text-ink-muted">{shopCopy.thankYouCallConfirm}</p>

      <section className="mt-8 border border-border p-5">
        <h2 className="font-display text-xl tracking-display text-ink">
          {emailCopy.linesHeading}
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {order.lines.map((line) => (
            <li
              key={`${line.variantId}-${line.sku}`}
              className="flex justify-between gap-4 text-sm text-ink"
            >
              <div className="min-w-0">
                <p className="font-medium">{line.name}</p>
                {line.variantLabel ? (
                  <p className="text-ink-muted">{line.variantLabel}</p>
                ) : null}
                <p className="text-ink-muted">
                  {line.qty} × {formatCents(line.priceCents)}
                </p>
              </div>
              <p className="shrink-0 font-medium">
                {formatCents(line.priceCents * line.qty)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-4 flex flex-col gap-1 border-t border-border pt-4 text-sm text-ink">
          <div className="flex justify-between gap-4">
            <dt>{shopCopy.cartSubtotal}</dt>
            <dd>{formatCents(order.subtotalCents)}</dd>
          </div>
          {order.discountAmountCents > 0 ? (
            <div className="flex justify-between gap-4 text-ink-muted">
              <dt>{shopCopy.cartDiscount}</dt>
              <dd>−{formatCents(order.discountAmountCents)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt>{shopCopy.checkoutDeliveryLine}</dt>
            <dd>
              {order.deliveryCents === 0
                ? shopCopy.checkoutFree
                : formatCents(order.deliveryCents)}
            </dd>
          </div>
          <div className="mt-1 flex justify-between gap-4 border-t border-border pt-2 text-base font-medium">
            <dt>{shopCopy.checkoutTotal}</dt>
            <dd>{formatCents(order.totalCents)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-ink">
            {emailCopy.addressHeading}
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm text-ink-muted">
            {formatAddress(order.delivery)}
          </p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-ink">
            {emailCopy.paymentHeading}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">{paymentText}</p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-ink">
          {emailCopy.contactHeading}
        </h2>
        <p className="mt-2 whitespace-pre-line text-sm text-ink-muted">
          {company.name}
          {"\n"}
          {company.email}
          {"\n"}
          {company.phone}
          {"\n"}
          {company.address}
        </p>
      </section>

      <Link
        href="/"
        className="mt-10 inline-flex min-h-11 items-center justify-center bg-ink px-5 text-sm font-medium text-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {shopCopy.thankYouContinue}
      </Link>
    </div>
  );
}

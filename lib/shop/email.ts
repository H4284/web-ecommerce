import "server-only";
import { render } from "@react-email/components";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { OrderAdminEmail } from "@/emails/order-admin";
import { OrderConfirmationEmail } from "@/emails/order-confirmation";
import { OrderStatusEmail } from "@/emails/order-status";
import {
  emailCopy,
  type OrderEmailModel,
} from "@/lib/shop/order-email-model";
import { getShopSettingsUncached } from "@/lib/shop/settings-queries";

export type OrderEmailMarks = {
  confirmationAt?: string;
  adminAt?: string;
  statusAt?: string;
};

type OrderDocForEmail = {
  number: string;
  status: string;
  paymentMethodId: string;
  paymentStatus: string;
  lines: Array<{
    name: string;
    variantLabel: string;
    sku: string;
    qty: number;
    priceCents: number;
  }>;
  subtotalCents: number;
  discount?: { amountCents?: number };
  deliveryCents: number;
  totalCents: number;
  delivery: OrderEmailModel["delivery"];
  customer: { email: string; name: string; phone?: string };
  emails?: OrderEmailMarks;
};

/** Test hook — counts deliver attempts (logged or Resend). */
export const emailSendStats = {
  confirmation: 0,
  admin: 0,
  status: 0,
  reset() {
    this.confirmation = 0;
    this.admin = 0;
    this.status = 0;
  },
};

async function deliver(opts: {
  to: string;
  subject: string;
  html: string;
  from: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(
      `[email:log] from=${opts.from} to=${opts.to} subject=${opts.subject}\n${opts.html}`,
    );
    return;
  }
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: opts.from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
  if (error) {
    throw new Error(`Resend failed: ${error.message}`);
  }
}

function fromAddress(company: { name: string; email: string }): string {
  return `${company.name} <${company.email}>`;
}

export async function orderToEmailModel(
  orderId: string,
  order: OrderDocForEmail,
  statusNote?: string,
): Promise<OrderEmailModel> {
  const settings = await getShopSettingsUncached();
  return {
    orderId,
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
    discountAmountCents: order.discount?.amountCents ?? 0,
    deliveryCents: order.deliveryCents,
    totalCents: order.totalCents,
    delivery: order.delivery,
    customerEmail: order.customer.email,
    customerName: order.customer.name,
    company: settings.company,
    statusNote,
  };
}

function orderFromRow(row: Record<string, unknown>): OrderDocForEmail {
  const lines = (row.lines as OrderDocForEmail["lines"]) ?? [];
  return {
    number: String(row.number),
    status: String(row.status),
    paymentMethodId: String(row.payment_method_id),
    paymentStatus: String(row.payment_status),
    lines,
    subtotalCents: Number(row.subtotal_cents),
    discount: row.discount as OrderDocForEmail["discount"],
    deliveryCents: Number(row.delivery_cents),
    totalCents: Number(row.total_cents),
    delivery: row.delivery as OrderDocForEmail["delivery"],
    customer: row.customer as OrderDocForEmail["customer"],
    emails: (row.emails as OrderEmailMarks) ?? {},
  };
}

async function loadOrderRow(orderId: string): Promise<OrderDocForEmail> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Order ${orderId} missing`);
  return orderFromRow(data as Record<string, unknown>);
}

async function patchOrderEmails(
  orderId: string,
  emails: OrderEmailMarks,
): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("orders")
    .update({ emails })
    .eq("id", orderId);
  if (error) throw error;
}

/**
 * Send customer confirmation + admin notice after the order transaction.
 * Skips any email already marked on the order document.
 */
export async function sendOrderEmails(orderId: string): Promise<{
  confirmation: boolean;
  admin: boolean;
}> {
  const order = await loadOrderRow(orderId);
  const marks = { ...(order.emails ?? {}) };
  const model = await orderToEmailModel(orderId, order);
  const from = fromAddress(model.company);
  const settings = await getShopSettingsUncached();

  let confirmation = false;
  let admin = false;

  if (!marks.confirmationAt) {
    const html = await render(OrderConfirmationEmail({ model }));
    await deliver({
      to: model.customerEmail,
      subject: emailCopy.confirmationSubject(model.number),
      html,
      from,
    });
    emailSendStats.confirmation += 1;
    marks.confirmationAt = new Date().toISOString();
    await patchOrderEmails(orderId, marks);
    confirmation = true;
  }

  if (!marks.adminAt) {
    const html = await render(OrderAdminEmail({ model }));
    await deliver({
      to: settings.ordersInbox,
      subject: emailCopy.adminSubject(model.number),
      html,
      from,
    });
    emailSendStats.admin += 1;
    marks.adminAt = new Date().toISOString();
    await patchOrderEmails(orderId, marks);
    admin = true;
  }

  return { confirmation, admin };
}

/** Status-change email (unit 28). Idempotent per call site via timeline, not a mark. */
export async function sendOrderStatusEmail(
  orderId: string,
  statusNote?: string,
): Promise<boolean> {
  const order = await loadOrderRow(orderId);
  const model = await orderToEmailModel(orderId, order, statusNote);
  const html = await render(OrderStatusEmail({ model }));
  await deliver({
    to: model.customerEmail,
    subject: emailCopy.statusSubject(model.number, model.status),
    html,
    from: fromAddress(model.company),
  });
  emailSendStats.status += 1;
  const marks = { ...(order.emails ?? {}), statusAt: new Date().toISOString() };
  await patchOrderEmails(orderId, marks);
  return true;
}

/** Render confirmation HTML for previews / tests (no send). */
export async function renderOrderConfirmationHtml(
  model: OrderEmailModel,
): Promise<string> {
  return render(OrderConfirmationEmail({ model }));
}

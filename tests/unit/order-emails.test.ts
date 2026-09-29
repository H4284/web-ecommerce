import { describe, expect, it } from "vitest";
import { render } from "@react-email/components";
import { OrderConfirmationEmail } from "@/emails/order-confirmation";
import {
  emailCopy,
  paymentInstructions,
  type OrderEmailModel,
} from "@/lib/shop/order-email-model";
import { formatCents } from "@/lib/shop/money";

function sampleModel(partial: Partial<OrderEmailModel> = {}): OrderEmailModel {
  return {
    orderId: "ord-1",
    number: "SAN-2026-00001",
    status: "pending",
    paymentMethodId: "cod",
    paymentStatus: "cod_due",
    lines: [
      {
        name: "Qelibar",
        variantLabel: "50 ml / EDP",
        sku: "PROD-01-50-EDP",
        qty: 1,
        priceCents: 4200,
      },
    ],
    subtotalCents: 4200,
    discountAmountCents: 0,
    deliveryCents: 200,
    totalCents: 4400,
    delivery: {
      recipient: "Test Test",
      address: "Rruga 1",
      city: "Prishtinë",
      postalCode: "10000",
      phone: "+38349123456",
      country: "XK",
    },
    customerEmail: "test@example.com",
    customerName: "Test Test",
    company: {
      name: "Sanem",
      email: "orders@sanem.test",
      phone: "+38349625317",
      address: "Prishtinë, Kosovo",
      iban: "XK05TESTIBAN",
    },
    ...partial,
  };
}

describe("order email copy", () => {
  it("uses COD payment text", () => {
    expect(paymentInstructions(sampleModel())).toBe(emailCopy.paymentCod);
  });

  it("includes IBAN, amount and order number for transfer", () => {
    const model = sampleModel({
      paymentMethodId: "transfer",
      paymentStatus: "awaiting_payment",
    });
    const text = paymentInstructions(model);
    expect(text).toContain(formatCents(4400));
    expect(text).toContain("XK05TESTIBAN");
    expect(text).toContain("SAN-2026-00001");
  });
});

describe("order confirmation HTML", () => {
  it("renders key fields at mobile width", async () => {
    const html = await render(OrderConfirmationEmail({ model: sampleModel() }));
    expect(html).toContain("SAN-2026-00001");
    expect(html).toContain("Qelibar");
    expect(html).toContain("Prishtinë");
    expect(html).toContain(emailCopy.paymentCod);
    expect(html).toContain("max-width:375px");
    expect(html).toContain(formatCents(4400));
  });
});

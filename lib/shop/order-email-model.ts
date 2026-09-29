import { formatCents } from "@/lib/shop/money";

export type OrderEmailLine = {
  name: string;
  variantLabel: string;
  sku: string;
  qty: number;
  priceCents: number;
};

export type OrderEmailAddress = {
  recipient: string;
  address: string;
  city: string;
  postalCode?: string;
  phone: string;
  country: string;
};

export type OrderEmailModel = {
  orderId: string;
  number: string;
  status: string;
  paymentMethodId: string;
  paymentStatus: string;
  lines: OrderEmailLine[];
  subtotalCents: number;
  discountAmountCents: number;
  deliveryCents: number;
  totalCents: number;
  delivery: OrderEmailAddress;
  customerEmail: string;
  customerName: string;
  company: {
    name: string;
    email: string;
    phone: string;
    address: string;
    iban: string;
  };
  /** Optional note for status emails. */
  statusNote?: string;
};

export const emailCopy = {
  confirmationSubject: (number: string) => `Porosia ${number} — Sanem`,
  adminSubject: (number: string) => `Porosi e re ${number}`,
  statusSubject: (number: string, status: string) =>
    `Porosia ${number}: ${status}`,
  greeting: (name: string) => `Përshëndetje ${name},`,
  confirmationIntro: "Faleminderit për porosinë. Ja detajet:",
  adminIntro: "Ka ardhur një porosi e re.",
  statusIntro: (status: string) => `Statusi i ri i porosisë: ${status}.`,
  linesHeading: "Artikujt",
  subtotal: "Nëntotali",
  discount: "Zbritja",
  delivery: "Transporti",
  total: "Totali",
  free: "Falas",
  addressHeading: "Adresa e dorëzimit",
  paymentHeading: "Pagesa",
  paymentCod: "Paguani korrierin me para në dorëzim.",
  paymentTransfer: (amount: string, iban: string, reference: string) =>
    `Transferoni ${amount} në IBAN ${iban}. Referenca e pagesës: ${reference}.`,
  paymentTransferMissingIban:
    "Transfer bankar — IBAN do të dërgohet nga dyqani. Përdorni numrin e porosisë si referencë.",
  paymentCard: "Pagesa me kartë në faqen e bankës.",
  contactHeading: "Kontakti i dyqanit",
  footer: "Sanem — quiet luxury in a bottle",
} as const;

export function paymentInstructions(model: OrderEmailModel): string {
  if (model.paymentMethodId === "cod") return emailCopy.paymentCod;
  if (model.paymentMethodId === "transfer") {
    if (!model.company.iban.trim()) {
      return `${emailCopy.paymentTransferMissingIban} (${model.number})`;
    }
    return emailCopy.paymentTransfer(
      formatCents(model.totalCents),
      model.company.iban,
      model.number,
    );
  }
  return emailCopy.paymentCard;
}

export function formatAddress(a: OrderEmailAddress): string {
  const postal = a.postalCode?.trim();
  const line2 = postal ? `${postal}, ${a.city}` : a.city;
  return `${a.recipient}\n${a.address}\n${line2}\n${a.phone}`;
}

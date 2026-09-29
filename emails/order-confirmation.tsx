import type { CSSProperties } from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { formatCents } from "@/lib/shop/money";
import {
  emailCopy,
  formatAddress,
  paymentInstructions,
  type OrderEmailModel,
} from "@/lib/shop/order-email-model";

const wrap: CSSProperties = {
  backgroundColor: "#f5f5f4",
  fontFamily: 'Source Sans 3, "Segoe UI", Helvetica, Arial, sans-serif',
  margin: 0,
  padding: "24px 12px",
};

const card: CSSProperties = {
  backgroundColor: "#ffffff",
  maxWidth: "375px",
  margin: "0 auto",
  padding: "24px 20px",
  color: "#1c1917",
  fontSize: "15px",
  lineHeight: "1.5",
};

const muted: CSSProperties = { color: "#57534e", fontSize: "13px" };

export function OrderConfirmationEmail({ model }: { model: OrderEmailModel }) {
  return (
    <Html lang="sq">
      <Head />
      <Preview>{emailCopy.confirmationSubject(model.number)}</Preview>
      <Body style={wrap}>
        <Container style={card}>
          <Heading as="h1" style={{ fontSize: "22px", margin: "0 0 12px" }}>
            {model.number}
          </Heading>
          <Text>{emailCopy.greeting(model.customerName)}</Text>
          <Text>{emailCopy.confirmationIntro}</Text>

          <Section>
            <Text style={{ fontWeight: 600, marginBottom: 8 }}>
              {emailCopy.linesHeading}
            </Text>
            {model.lines.map((line) => (
              <Text key={`${line.sku}-${line.qty}`} style={{ margin: "0 0 8px" }}>
                {line.name}
                {line.variantLabel ? ` — ${line.variantLabel}` : ""}
                <br />
                <span style={muted}>
                  {line.qty} × {formatCents(line.priceCents)} · {line.sku}
                </span>
              </Text>
            ))}
            <Hr />
            <Text style={{ margin: "4px 0" }}>
              {emailCopy.subtotal}: {formatCents(model.subtotalCents)}
            </Text>
            {model.discountAmountCents > 0 ? (
              <Text style={{ margin: "4px 0" }}>
                {emailCopy.discount}: −{formatCents(model.discountAmountCents)}
              </Text>
            ) : null}
            <Text style={{ margin: "4px 0" }}>
              {emailCopy.delivery}:{" "}
              {model.deliveryCents === 0
                ? emailCopy.free
                : formatCents(model.deliveryCents)}
            </Text>
            <Text style={{ margin: "8px 0 0", fontWeight: 600 }}>
              {emailCopy.total}: {formatCents(model.totalCents)}
            </Text>
          </Section>

          <Hr />
          <Text style={{ fontWeight: 600 }}>{emailCopy.addressHeading}</Text>
          <Text style={{ whiteSpace: "pre-line", marginTop: 0 }}>
            {formatAddress(model.delivery)}
          </Text>
          <Text style={{ fontWeight: 600 }}>{emailCopy.paymentHeading}</Text>
          <Text>{paymentInstructions(model)}</Text>
          <Hr />
          <Text style={{ fontWeight: 600, marginBottom: 4 }}>
            {emailCopy.contactHeading}
          </Text>
          <Text style={{ ...muted, margin: 0, whiteSpace: "pre-line" }}>
            {model.company.name}
            {"\n"}
            {model.company.email}
            {"\n"}
            {model.company.phone}
            {"\n"}
            {model.company.address}
          </Text>
          <Text style={{ ...muted, marginTop: 24 }}>{emailCopy.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderConfirmationEmail;

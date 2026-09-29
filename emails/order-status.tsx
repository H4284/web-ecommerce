import type { CSSProperties } from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import { formatCents } from "@/lib/shop/money";
import {
  emailCopy,
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

/** Status-change email — used by admin order status updates (unit 28). */
export function OrderStatusEmail({ model }: { model: OrderEmailModel }) {
  return (
    <Html lang="sq">
      <Head />
      <Preview>{emailCopy.statusSubject(model.number, model.status)}</Preview>
      <Body style={wrap}>
        <Container style={card}>
          <Heading as="h1" style={{ fontSize: "22px", margin: "0 0 12px" }}>
            {model.number}
          </Heading>
          <Text>{emailCopy.greeting(model.customerName)}</Text>
          <Text>{emailCopy.statusIntro(model.status)}</Text>
          {model.statusNote ? (
            <Text style={muted}>{model.statusNote}</Text>
          ) : null}
          <Text style={{ fontWeight: 600, marginTop: 16 }}>
            {emailCopy.total}: {formatCents(model.totalCents)}
          </Text>
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

export default OrderStatusEmail;

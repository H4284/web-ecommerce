import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  const value = process.env.ORDER_LINK_SECRET;
  if (!value) {
    throw new Error("ORDER_LINK_SECRET is not set");
  }
  return value;
}

/** HMAC-SHA256 hex token for a thank-you URL. */
export function signOrderLink(orderId: string): string {
  return createHmac("sha256", secret()).update(orderId).digest("hex");
}

export function thankYouPath(orderId: string, token: string): string {
  return `/orders/${orderId}/thank-you?t=${encodeURIComponent(token)}`;
}

/** Constant-time token check. Wrong length returns false (never throws). */
export function verifyOrderLink(orderId: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const expected = signOrderLink(orderId);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Security headers for App Hosting (no nonce — ADR 0007).
 * BANK_ENDPOINT is optional until card payments ship.
 */
export function buildContentSecurityPolicy(): string {
  const bank = (process.env.BANK_ENDPOINT ?? "").replace(/\/$/, "");
  const connect = [
    "'self'",
    "https://challenges.cloudflare.com",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://*.googleapis.com",
    "https://identitytoolkit.googleapis.com",
    "https://securetoken.googleapis.com",
    "https://firestore.googleapis.com",
    "https://firebase.googleapis.com",
    "https://firebasestorage.googleapis.com",
    "https://www.googleapis.com",
    "https://*.firebaseio.com",
    "wss://*.firebaseio.com",
    "http://127.0.0.1:*",
    "http://localhost:*",
    bank,
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    // Next.js App Router needs inline/eval without a nonce on App Hosting.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: http://127.0.0.1:* http://localhost:*",
    "font-src 'self' data:",
    `connect-src ${connect}`,
    "frame-src https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function securityHeaderList(): Array<{ key: string; value: string }> {
  return [
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=()",
    },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
  ];
}

/** Env names that must never appear in the client bundle. */
export const SECRET_ENV_NAMES = [
  "ORDER_LINK_SECRET",
  "BANK_SECRET_KEY",
  "BANK_MERCHANT_ID",
  "TURNSTILE_SECRET_KEY",
  "RESEND_API_KEY",
  "SANITY_API_READ_TOKEN",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_PASSWORD",
  "FIREBASE_PRIVATE_KEY",
  "GOOGLE_APPLICATION_CREDENTIALS",
] as const;

/** Card-adjacent identifiers that must not exist in app source. */
export const FORBIDDEN_CARD_IDENTIFIERS = [
  "cardNumber",
  "card_number",
  "cvv",
  "cvc",
  "panToken",
  "primaryAccountNumber",
] as const;

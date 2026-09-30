/**
 * Firestore emulator REST helpers for Playwright (no Admin SDK in the browser).
 * Emulator accepts `Authorization: Bearer owner` for unrestricted access.
 */

const PROJECT =
  process.env.GCLOUD_PROJECT ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
  "demo-sanem";
const FIRESTORE_HOST =
  process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";

type FirestoreValue =
  | { integerValue: string }
  | { stringValue: string }
  | { booleanValue: boolean }
  | { mapValue: { fields?: Record<string, FirestoreValue> } }
  | { arrayValue: { values?: FirestoreValue[] } };

function docUrl(path: string): string {
  const clean = path.replace(/^\/+|\/+$/g, "");
  return `http://${FIRESTORE_HOST}/v1/projects/${PROJECT}/databases/(default)/documents/${clean}`;
}

async function getDoc(path: string): Promise<Record<string, FirestoreValue> | undefined> {
  const res = await fetch(docUrl(path), {
    headers: { Authorization: "Bearer owner" },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firestore get ${path} failed: ${res.status} ${body}`);
  }
  const json = (await res.json()) as { fields?: Record<string, FirestoreValue> };
  return json.fields;
}

function readInt(fields: Record<string, FirestoreValue> | undefined, key: string): number {
  const v = fields?.[key];
  if (!v || !("integerValue" in v)) {
    throw new Error(`Missing integer field ${key}`);
  }
  return Number(v.integerValue);
}

export async function getVariantStock(
  productId: string,
  variantId: string,
): Promise<{ stock: number; priceCents: number }> {
  const fields = await getDoc(`products/${productId}/variants/${variantId}`);
  return {
    stock: readInt(fields, "stock"),
    priceCents: readInt(fields, "priceCents"),
  };
}

export async function getOrderTotal(orderId: string): Promise<{
  totalCents: number;
  subtotalCents: number;
  linePriceCents: number;
}> {
  const fields = await getDoc(`orders/${orderId}`);
  const lines = fields?.lines;
  if (!lines || !("arrayValue" in lines) || !lines.arrayValue.values?.[0]) {
    throw new Error("Order has no lines");
  }
  const first = lines.arrayValue.values[0];
  if (!("mapValue" in first)) throw new Error("Bad line shape");
  return {
    totalCents: readInt(fields, "totalCents"),
    subtotalCents: readInt(fields, "subtotalCents"),
    linePriceCents: readInt(first.mapValue.fields, "priceCents"),
  };
}

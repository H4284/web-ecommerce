import "server-only";
import {
  FieldValue,
  type DocumentReference,
} from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import { getUser } from "@/lib/shop/auth";
import { mergeCartLines } from "@/lib/shop/cart-schema";
import {
  toNormalizedCheckoutPayload,
  type CheckoutFormValues,
} from "@/lib/shop/checkout-schema";
import {
  discountSchema,
  evaluateDiscount,
  type DiscountDoc,
} from "@/lib/shop/discounts";
import { signOrderLink, thankYouPath } from "@/lib/shop/order-link";
import type {
  CreateOrderBody,
  OrderStockConflict,
  OrderSuccessResponse,
} from "@/lib/shop/order-schema";
import {
  productSchema,
  variantSchema,
  type Product,
  type Variant,
} from "@/lib/shop/schemas";
import {
  deliveryFeeCents,
  shopSettingsSchema,
  type ShopSettings,
} from "@/lib/shop/settings-schema";
import { variantLabel } from "@/lib/shop/variants";
import { shopCopy } from "@/content/shop";

export class OrderStockError extends Error {
  readonly conflict: OrderStockConflict;

  constructor(conflict: OrderStockConflict) {
    super(conflict.message);
    this.name = "OrderStockError";
    this.conflict = conflict;
  }
}

export class OrderValidationError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "OrderValidationError";
    this.status = status;
  }
}

type ProductDoc = Product & { id: string };
type VariantDoc = Variant & { id: string };

type LineSnapshot = {
  variantId: string;
  productId: string;
  productSlug: string;
  sku: string;
  name: string;
  variantLabel: string;
  imagePath: string | null;
  priceCents: number;
  compareAtCents: number | null;
  qty: number;
};

function formatOrderNumber(prefix: string, year: number, seq: number): string {
  return `${prefix}-${year}-${String(seq).padStart(5, "0")}`;
}

function honeypotSuccess(): OrderSuccessResponse {
  return {
    orderId: "honeypot",
    number: "SAN-00000",
    thankYouUrl: "/",
  };
}

/** Create an order in one Firestore transaction. Ignores client prices. */
export async function createOrder(
  body: CreateOrderBody,
  options?: { now?: Date },
): Promise<OrderSuccessResponse> {
  if (body.website && body.website.length > 0) {
    return honeypotSuccess();
  }

  const now = options?.now ?? new Date();
  const checkoutValues = body as CheckoutFormValues;
  const normalized = toNormalizedCheckoutPayload(checkoutValues);
  const merged = mergeCartLines(body.lines);

  const user = await getUser();
  const orderRef = db.collection("orders").doc();
  const counterRef = db.collection("counters").doc("orders");
  const settingsRef = db.collection("settings").doc("shop");
  const discountCode = body.discountCode?.trim().toUpperCase() || null;
  const discountRef = discountCode
    ? db.collection("discounts").doc(discountCode)
    : null;

  const result = await db.runTransaction(async (tx) => {
    const settingsSnap = await tx.get(settingsRef);
    if (!settingsSnap.exists) {
      throw new OrderValidationError("Shop settings missing", 500);
    }
    const settings: ShopSettings = shopSettingsSchema.parse(settingsSnap.data());

    const deliveryMethod = settings.deliveryMethods.find(
      (m) => m.id === normalized.deliveryMethodId && m.active,
    );
    if (!deliveryMethod) {
      throw new OrderValidationError(shopCopy.fieldRequired);
    }

    const paymentMethod = settings.paymentMethods.find(
      (m) => m.id === normalized.paymentMethodId && m.active,
    );
    if (!paymentMethod) {
      throw new OrderValidationError(shopCopy.fieldRequired);
    }

    const counterSnap = await tx.get(counterRef);
    const currentSeq = counterSnap.exists
      ? Number((counterSnap.data() as { seq?: number }).seq ?? 0)
      : 0;
    if (!Number.isInteger(currentSeq) || currentSeq < 0) {
      throw new OrderValidationError("Order counter invalid", 500);
    }
    const nextSeq = currentSeq + 1;

    let discountDoc: DiscountDoc | null = null;
    if (discountRef) {
      const discountSnap = await tx.get(discountRef);
      if (discountSnap.exists) {
        const parsed = discountSchema.safeParse(discountSnap.data());
        if (parsed.success) discountDoc = parsed.data;
      }
    }

    type Loaded = {
      input: (typeof merged)[number];
      product: ProductDoc;
      variant: VariantDoc;
      productRef: DocumentReference;
      variantRef: DocumentReference;
    };
    const loaded: Loaded[] = [];

    for (const line of merged) {
      const productRef = db.collection("products").doc(line.productId);
      const variantRef = productRef.collection("variants").doc(line.variantId);
      const productSnap = await tx.get(productRef);
      const variantSnap = await tx.get(variantRef);

      if (!productSnap.exists || !variantSnap.exists) {
        throw new OrderStockError({
          error: "stock",
          sku: line.variantId,
          available: 0,
          message: shopCopy.cartVariantMissing,
        });
      }

      const productParsed = productSchema.safeParse(productSnap.data());
      const variantParsed = variantSchema.safeParse(variantSnap.data());
      if (!productParsed.success || !variantParsed.success) {
        throw new OrderValidationError("Catalog data invalid", 500);
      }

      const product = { id: productSnap.id, ...productParsed.data };
      const variant = { id: variantSnap.id, ...variantParsed.data };

      if (product.status !== "active") {
        throw new OrderStockError({
          error: "stock",
          sku: variant.sku,
          available: 0,
          message: shopCopy.cartProductUnavailable,
        });
      }

      if (variant.stock < line.qty) {
        throw new OrderStockError({
          error: "stock",
          sku: variant.sku,
          available: variant.stock,
          message: `${shopCopy.cartQtyClamped} (${variant.sku}: ${variant.stock})`,
        });
      }

      loaded.push({ input: line, product, variant, productRef, variantRef });
    }

    const qtyByVariant = new Map<string, number>();
    for (const row of loaded) {
      const key = `${row.product.id}::${row.variant.id}`;
      qtyByVariant.set(key, (qtyByVariant.get(key) ?? 0) + row.input.qty);
    }

    // Re-check summed qty against stock (duplicate lines merged).
    for (const row of loaded) {
      const key = `${row.product.id}::${row.variant.id}`;
      const qty = qtyByVariant.get(key)!;
      if (row.variant.stock < qty) {
        throw new OrderStockError({
          error: "stock",
          sku: row.variant.sku,
          available: row.variant.stock,
          message: `${shopCopy.cartQtyClamped} (${row.variant.sku}: ${row.variant.stock})`,
        });
      }
    }

    const lineSnapshots: LineSnapshot[] = loaded.map((row) => ({
      variantId: row.variant.id,
      productId: row.product.id,
      productSlug: row.product.slug,
      sku: row.variant.sku,
      name: row.product.name,
      variantLabel: variantLabel(row.product.options, row.variant),
      imagePath: row.variant.image?.path ?? row.product.images[0]?.path ?? null,
      priceCents: row.variant.priceCents,
      compareAtCents: row.variant.compareAtCents ?? null,
      qty: row.input.qty,
    }));

    let subtotalCents = 0;
    for (const line of lineSnapshots) {
      subtotalCents += line.priceCents * line.qty;
    }

    const discount = evaluateDiscount(discountCode, discountDoc, subtotalCents, now);
    if (discountCode && discount.message) {
      throw new OrderValidationError(discount.message);
    }

    const netSubtotal = Math.max(0, subtotalCents - discount.amountCents);
    const deliveryCents = discount.freeDelivery
      ? 0
      : deliveryFeeCents(netSubtotal, deliveryMethod);
    const totalCents = netSubtotal + deliveryCents;

    const year = now.getUTCFullYear();
    const number = formatOrderNumber(settings.orderPrefix, year, nextSeq);
    const createdAt = now.toISOString();

    const paymentStatus =
      normalized.paymentMethodId === "cod" ? "cod_due" : "awaiting_payment";

    const writtenVariants = new Set<string>();
    const touchedProducts = new Map<
      string,
      { ref: DocumentReference; product: ProductDoc; delta: number }
    >();

    for (const row of loaded) {
      const key = `${row.product.id}::${row.variant.id}`;
      if (writtenVariants.has(key)) continue;
      writtenVariants.add(key);

      const qty = qtyByVariant.get(key)!;
      const nextStock = row.variant.stock - qty;
      if (nextStock < 0) {
        throw new OrderStockError({
          error: "stock",
          sku: row.variant.sku,
          available: row.variant.stock,
          message: shopCopy.cartQtyClamped,
        });
      }

      tx.update(row.variantRef, { stock: nextStock });

      const existing = touchedProducts.get(row.product.id);
      if (existing) {
        existing.delta += qty;
      } else {
        touchedProducts.set(row.product.id, {
          ref: row.productRef,
          product: row.product,
          delta: qty,
        });
      }
    }

    for (const item of touchedProducts.values()) {
      const nextTotal = item.product.totalStock - item.delta;
      if (nextTotal < 0) {
        throw new OrderValidationError("totalStock would go negative", 500);
      }
      tx.update(item.ref, {
        totalStock: nextTotal,
        updatedAt: createdAt,
      });
    }

    if (discountRef && discount.code) {
      tx.update(discountRef, { usedCount: FieldValue.increment(1) });
    }

    if (counterSnap.exists) {
      tx.update(counterRef, { seq: nextSeq });
    } else {
      tx.set(counterRef, { seq: nextSeq });
    }

    tx.set(orderRef, {
      number,
      status: "pending",
      paymentStatus,
      stockTaken: true,
      customer: {
        email: normalized.email,
        phone: normalized.delivery.phone,
        name: normalized.delivery.recipient,
        uid: user?.uid ?? null,
      },
      delivery: normalized.delivery,
      billing: normalized.billing,
      billingSameAsDelivery: normalized.billingSameAsDelivery,
      lines: lineSnapshots,
      subtotalCents,
      discount: {
        code: discount.code,
        type: discount.type,
        amountCents: discount.amountCents,
        freeDelivery: discount.freeDelivery,
      },
      deliveryMethodId: deliveryMethod.id,
      deliveryCents,
      paymentMethodId: paymentMethod.id,
      totalCents,
      newsletterOptIn: normalized.newsletterOptIn,
      createdAt,
      timeline: [
        {
          status: "pending",
          at: createdAt,
          by: user?.uid ?? "guest",
          note: "",
        },
      ],
      emails: {},
    });

    return {
      orderId: orderRef.id,
      number,
      thankYouUrl: thankYouPath(orderRef.id, signOrderLink(orderRef.id)),
    } satisfies OrderSuccessResponse;
  });

  return result;
}

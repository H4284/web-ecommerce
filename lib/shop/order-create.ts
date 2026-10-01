import "server-only";
import { getUser, type ShopUser } from "@/lib/shop/auth";
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
import { createPgClient } from "@/lib/supabase/pg";
import { randomBytes } from "node:crypto";

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

type CreateOrderOptions = {
  now?: Date;
  /** When provided (including `null`), skip reading the session cookie. */
  user?: ShopUser | null;
};

function mapProduct(row: Record<string, unknown>): ProductDoc {
  const raw = {
    name: row.name,
    slug: row.slug,
    brandId: row.brand_id,
    categoryIds: row.category_ids,
    shortDescription: row.short_description,
    description: row.description,
    images: row.images,
    options: row.options,
    status: row.status,
    isNew: row.is_new,
    isBestSeller: row.is_best_seller,
    unit: row.unit,
    relatedIds: row.related_ids,
    searchTokens: row.search_tokens,
    minPriceCents: row.min_price_cents,
    maxPriceCents: row.max_price_cents,
    totalStock: row.total_stock,
    defaultVariantId: row.default_variant_id,
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date(row.created_at as string).toISOString(),
    updatedAt:
      typeof row.updated_at === "string"
        ? row.updated_at
        : new Date(row.updated_at as string).toISOString(),
    seo: row.seo ?? undefined,
  };
  return { id: String(row.id), ...productSchema.parse(raw) };
}

function mapVariant(row: Record<string, unknown>): VariantDoc {
  const raw = {
    sku: row.sku,
    optionValues: row.option_values,
    priceCents: row.price_cents,
    compareAtCents: row.compare_at_cents,
    stock: row.stock,
    isDefault: row.is_default,
    image: row.image,
  };
  return { id: String(row.id), ...variantSchema.parse(raw) };
}

/** Create an order in one Postgres transaction. Ignores client prices. */
export async function createOrder(
  body: CreateOrderBody,
  options?: CreateOrderOptions,
): Promise<OrderSuccessResponse> {
  if (body.website && body.website.length > 0) {
    return honeypotSuccess();
  }

  const now = options?.now ?? new Date();
  const checkoutValues = body as CheckoutFormValues;
  const normalized = toNormalizedCheckoutPayload(checkoutValues);
  const merged = mergeCartLines(body.lines);

  const user =
    options !== undefined && "user" in options
      ? (options.user ?? null)
      : await getUser();

  const discountCode = body.discountCode?.trim().toUpperCase() || null;
  const orderId = randomBytes(12).toString("hex");
  const createdAt = now.toISOString();

  const client = createPgClient();
  await client.connect();

  let result: OrderSuccessResponse;
  try {
    await client.query("begin");

    const settingsRes = await client.query(
      `select * from shop_settings where id = 'shop' for update`,
    );
    if (!settingsRes.rowCount) {
      throw new OrderValidationError("Shop settings missing", 500);
    }
    const s = settingsRes.rows[0] as Record<string, unknown>;
    const settings: ShopSettings = shopSettingsSchema.parse({
      deliveryMethods: s.delivery_methods,
      paymentMethods: s.payment_methods,
      orderPrefix: s.order_prefix,
      ordersInbox: s.orders_inbox,
      company: s.company,
    });

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

    const counterRes = await client.query(
      `insert into counters (id, seq) values ('orders', 1)
       on conflict (id) do update set seq = counters.seq + 1
       returning seq`,
    );
    const nextSeq = Number(counterRes.rows[0].seq);

    let discountDoc: DiscountDoc | null = null;
    if (discountCode) {
      const dRes = await client.query(
        `select * from discounts where code = $1 for update`,
        [discountCode],
      );
      if (dRes.rowCount) {
        const d = dRes.rows[0] as Record<string, unknown>;
        const parsed = discountSchema.safeParse({
          type: d.type,
          value: d.value,
          minSubtotalCents: d.min_subtotal_cents,
          startsAt:
            typeof d.starts_at === "string"
              ? d.starts_at
              : new Date(d.starts_at as string).toISOString(),
          endsAt:
            typeof d.ends_at === "string"
              ? d.ends_at
              : new Date(d.ends_at as string).toISOString(),
          usageLimit: d.usage_limit,
          usedCount: d.used_count,
          active: d.active,
        });
        if (parsed.success) discountDoc = parsed.data;
      }
    }

    type Loaded = {
      input: (typeof merged)[number];
      product: ProductDoc;
      variant: VariantDoc;
    };
    const loaded: Loaded[] = [];

    for (const line of merged) {
      const pRes = await client.query(
        `select * from products where id = $1 for update`,
        [line.productId],
      );
      const vRes = await client.query(
        `select * from variants where product_id = $1 and id = $2 for update`,
        [line.productId, line.variantId],
      );

      if (!pRes.rowCount || !vRes.rowCount) {
        throw new OrderStockError({
          error: "stock",
          sku: line.variantId,
          available: 0,
          message: shopCopy.cartVariantMissing,
        });
      }

      const product = mapProduct(pRes.rows[0] as Record<string, unknown>);
      const variant = mapVariant(vRes.rows[0] as Record<string, unknown>);

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

      loaded.push({ input: line, product, variant });
    }

    const qtyByVariant = new Map<string, number>();
    for (const row of loaded) {
      const key = `${row.product.id}::${row.variant.id}`;
      qtyByVariant.set(key, (qtyByVariant.get(key) ?? 0) + row.input.qty);
    }

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
    const paymentStatus =
      normalized.paymentMethodId === "cod" ? "cod_due" : "awaiting_payment";

    const writtenVariants = new Set<string>();
    const touchedProducts = new Map<string, { product: ProductDoc; delta: number }>();

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

      await client.query(
        `update variants set stock = $1, updated_at = $2
         where product_id = $3 and id = $4`,
        [nextStock, createdAt, row.product.id, row.variant.id],
      );

      const existing = touchedProducts.get(row.product.id);
      if (existing) {
        existing.delta += qty;
      } else {
        touchedProducts.set(row.product.id, {
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
      await client.query(
        `update products set total_stock = $1, updated_at = $2 where id = $3`,
        [nextTotal, createdAt, item.product.id],
      );
    }

    if (discountCode && discount.code) {
      await client.query(
        `update discounts set used_count = used_count + 1, updated_at = $1 where code = $2`,
        [createdAt, discountCode],
      );
    }

    await client.query(
      `insert into orders (
        id, number, status, payment_status, stock_taken,
        customer, delivery, billing, billing_same_as_delivery, lines,
        subtotal_cents, discount, delivery_method_id, delivery_cents,
        payment_method_id, total_cents, newsletter_opt_in, timeline, emails,
        created_at, updated_at
      ) values (
        $1,$2,'pending',$3,true,
        $4::jsonb,$5::jsonb,$6::jsonb,$7,$8::jsonb,
        $9,$10::jsonb,$11,$12,
        $13,$14,$15,$16::jsonb,'{}'::jsonb,
        $17,$17
      )`,
      [
        orderId,
        number,
        paymentStatus,
        JSON.stringify({
          email: normalized.email,
          phone: normalized.delivery.phone,
          name: normalized.delivery.recipient,
          uid: user?.uid ?? null,
        }),
        JSON.stringify(normalized.delivery),
        JSON.stringify(normalized.billing),
        normalized.billingSameAsDelivery,
        JSON.stringify(lineSnapshots),
        subtotalCents,
        JSON.stringify({
          code: discount.code,
          type: discount.type,
          amountCents: discount.amountCents,
          freeDelivery: discount.freeDelivery,
        }),
        deliveryMethod.id,
        deliveryCents,
        paymentMethod.id,
        totalCents,
        normalized.newsletterOptIn,
        JSON.stringify([
          {
            status: "pending",
            at: createdAt,
            by: user?.uid ?? "guest",
            note: "",
          },
        ]),
        createdAt,
      ],
    );

    await client.query("commit");

    result = {
      orderId,
      number,
      thankYouUrl: thankYouPath(orderId, signOrderLink(orderId)),
    };
  } catch (err) {
    try {
      await client.query("rollback");
    } catch {
      // ignore
    }
    throw err;
  } finally {
    await client.end();
  }

  try {
    const { sendOrderEmails } = await import("@/lib/shop/email");
    await sendOrderEmails(result.orderId);
  } catch (err) {
    console.error("[order-emails]", result.orderId, err);
  }

  return result;
}

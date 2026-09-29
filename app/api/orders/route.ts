import { NextResponse } from "next/server";
import {
  createOrder,
  OrderStockError,
  OrderValidationError,
} from "@/lib/shop/order-create";
import { createOrderBodySchema } from "@/lib/shop/order-schema";
import { verifyTurnstile } from "@/lib/shop/turnstile";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = json as { website?: string };
  // Honeypot first — same success shape, no work.
  if (typeof raw.website === "string" && raw.website.length > 0) {
    return NextResponse.json({
      orderId: "honeypot",
      number: "SAN-00000",
      thankYouUrl: "/",
    });
  }

  const parsed = createOrderBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid order body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const turnstileOk = await verifyTurnstile(parsed.data.turnstileToken);
  if (!turnstileOk) {
    return NextResponse.json({ error: "turnstile" }, { status: 400 });
  }

  try {
    const result = await createOrder(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof OrderStockError) {
      return NextResponse.json(err.conflict, { status: 409 });
    }
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[orders]", err);
    return NextResponse.json({ error: "Order failed" }, { status: 500 });
  }
}

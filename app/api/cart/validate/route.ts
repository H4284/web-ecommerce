import { NextResponse } from "next/server";
import { cartValidateBodySchema } from "@/lib/shop/cart-schema";
import { validateCart } from "@/lib/shop/cart-validate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = cartValidateBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid cart body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await validateCart({
      lines: parsed.data.lines,
      discountCode: parsed.data.discountCode ?? null,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[cart/validate]", err);
    return NextResponse.json({ error: "Cart validation failed" }, { status: 500 });
  }
}

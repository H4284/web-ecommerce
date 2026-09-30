import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/lib/firebase/admin";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
} from "@/lib/shop/auth-types";
import { ensureUserDoc } from "@/lib/shop/ensure-user";
import { verifyTurnstile } from "@/lib/shop/turnstile";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  idToken: z.string().min(1),
  turnstileToken: z.string().min(1),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = json as { website?: string };
  // Honeypot first — pretend success, no work.
  if (typeof raw.website === "string" && raw.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const turnstileOk = await verifyTurnstile(parsed.data.turnstileToken);
  if (!turnstileOk) {
    return NextResponse.json({ error: "turnstile" }, { status: 400 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(parsed.data.idToken);
    await ensureUserDoc(decoded);

    const sessionCookie = await adminAuth.createSessionCookie(parsed.data.idToken, {
      expiresIn: SESSION_MAX_AGE_SEC * 1000,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SEC,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

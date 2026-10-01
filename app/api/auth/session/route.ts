import { NextResponse } from "next/server";
import { z } from "zod";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  buildSessionCookieValue,
} from "@/lib/shop/auth";
import { ensureUserDoc } from "@/lib/shop/ensure-user";
import { verifyTurnstile } from "@/lib/shop/turnstile";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!url || !anon) {
      return NextResponse.json({ error: "Missing Supabase anon env" }, { status: 500 });
    }

    const userRes = await fetch(`${url}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${parsed.data.accessToken}`,
        apikey: anon,
      },
      cache: "no-store",
    });
    if (!userRes.ok) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const user = (await userRes.json()) as {
      id?: string;
      email?: string | null;
      user_metadata?: { name?: string };
    };
    if (!user.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await ensureUserDoc({
      id: user.id,
      email: user.email ?? null,
      name:
        typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : null,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      SESSION_COOKIE,
      buildSessionCookieValue({
        access_token: parsed.data.accessToken,
        refresh_token: parsed.data.refreshToken,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE_SEC,
        path: "/",
      },
    );
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

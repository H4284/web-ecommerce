import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { safeNextPath } from "@/lib/shop/auth-path";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  type ShopUser,
} from "@/lib/shop/auth-types";

export type { ShopUser } from "@/lib/shop/auth-types";
export { SESSION_COOKIE, SESSION_MAX_AGE_SEC } from "@/lib/shop/auth-types";

type SessionPayload = {
  access_token: string;
  refresh_token: string;
};

function encodeSession(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeSession(raw: string): SessionPayload | null {
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as Partial<SessionPayload>;
    if (
      typeof parsed.access_token !== "string" ||
      typeof parsed.refresh_token !== "string" ||
      !parsed.access_token ||
      !parsed.refresh_token
    ) {
      return null;
    }
    return {
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token,
    };
  } catch {
    return null;
  }
}

function anonAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error("Missing Supabase anon env");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function profileIsAdmin(userId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  return data?.is_admin === true;
}

async function shopUserFromAccessToken(
  accessToken: string,
): Promise<ShopUser | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return null;

  const res = await fetch(`${url}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anon,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { id?: string; email?: string | null };
  if (!body.id) return null;
  return {
    uid: body.id,
    email: body.email ?? null,
    admin: await profileIsAdmin(body.id),
  };
}

/** Encode tokens for the httpOnly session cookie. */
export function buildSessionCookieValue(payload: SessionPayload): string {
  return encodeSession(payload);
}

export async function getUser(): Promise<ShopUser | null> {
  let raw: string | undefined;
  try {
    const jar = await cookies();
    raw = jar.get(SESSION_COOKIE)?.value;
  } catch {
    // Outside a Next.js request (scripts / Vitest) — guest.
    return null;
  }
  if (!raw) return null;

  const session = decodeSession(raw);
  if (!session) return null;

  const direct = await shopUserFromAccessToken(session.access_token);
  if (direct) return direct;

  try {
    const client = anonAuthClient();
    const { data, error } = await client.auth.refreshSession({
      refresh_token: session.refresh_token,
    });
    if (error || !data.session?.access_token) return null;

    const user = await shopUserFromAccessToken(data.session.access_token);
    if (!user) return null;

    // Best-effort cookie refresh when still inside a mutable request.
    try {
      const jar = await cookies();
      jar.set(SESSION_COOKIE, encodeSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE_SEC,
        path: "/",
      });
    } catch {
      // Read-only cookie store (e.g. Server Component) — skip write.
    }

    return user;
  } catch {
    return null;
  }
}

export async function requireUser(next = "/account"): Promise<ShopUser> {
  const user = await getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(safeNextPath(next, "/account"))}`);
  }
  return user;
}

export async function requireAdmin(): Promise<ShopUser> {
  const user = await getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/admin")}`);
  }
  if (!user.admin) {
    redirect("/");
  }
  return user;
}

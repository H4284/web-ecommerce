/**
 * Smoke: Supabase password login → session cookie → getUser shape via /admin redirect.
 * Usage: pnpm run:local scripts/supabase-auth-smoke.ts
 */
import { createClient } from "@supabase/supabase-js";
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from "@/lib/shop/seed-e2e";

const base = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) throw new Error("missing supabase anon env");

  const supabase = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({
    email: E2E_ADMIN_EMAIL,
    password: E2E_ADMIN_PASSWORD,
  });
  if (error || !data.session) {
    console.error("signIn failed", error?.message);
    process.exit(1);
  }
  console.log("signed in", data.user?.id);

  const res = await fetch(`${base}/api/auth/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      turnstileToken: "dev-turnstile-token",
      website: "",
    }),
  });
  const text = await res.text();
  console.log("session status", res.status, text);
  if (!res.ok) process.exit(1);

  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookieHeader = setCookie.map((c) => c.split(";")[0]).join("; ");
  console.log("cookie set", cookieHeader ? "yes" : "no");

  const adminRes = await fetch(`${base}/admin`, {
    headers: { cookie: cookieHeader },
    redirect: "manual",
  });
  console.log("admin status", adminRes.status, adminRes.headers.get("location"));
  if (adminRes.status !== 200 && adminRes.status !== 307 && adminRes.status !== 302) {
    // 200 = ok, redirect might mean login still
  }
  if (adminRes.status === 307 || adminRes.status === 302) {
    const loc = adminRes.headers.get("location") ?? "";
    if (loc.includes("/login")) {
      console.error("admin still redirected to login");
      process.exit(1);
    }
  }
  console.log("ok auth smoke");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

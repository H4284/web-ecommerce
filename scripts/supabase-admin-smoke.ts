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
  if (error || !data.session) throw error ?? new Error("no session");

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
  if (!res.ok) throw new Error(`session ${res.status}`);
  const cookie = (res.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(";")[0])
    .join("; ");

  for (const path of ["/admin", "/admin/orders"]) {
    const page = await fetch(`${base}${path}`, { headers: { cookie } });
    const html = await page.text();
    console.log(
      path,
      page.status,
      "SAN",
      html.includes("SAN-2026"),
      "len",
      html.length,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Smoke-check Supabase service role + schema.
 * Usage: pnpm supabase:smoke
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const tables = [
  "categories",
  "brands",
  "products",
  "variants",
  "shop_settings",
  "home_content",
  "discounts",
  "counters",
  "orders",
  "profiles",
  "audit_logs",
] as const;

async function main() {
  const results: Record<string, string> = {};
  for (const table of tables) {
    // Do not use head:true — missing tables can look like success.
    const { error } = await admin.from(table).select("*").limit(1);
    results[table] = error ? `FAIL: ${error.message}` : "ok";
  }
  console.log(JSON.stringify({ url, tables: results }, null, 2));
  const failed = Object.values(results).some((v) => v.startsWith("FAIL"));
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

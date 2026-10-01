import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();
  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const missing = await admin
    .from("no_such_table_xyz")
    .select("*", { head: true, count: "exact" });
  const counters = await admin.from("counters").upsert({ id: "orders", seq: 0 }).select();

  console.log(
    JSON.stringify(
      {
        missingTable: missing.error?.message ?? "unexpected ok",
        countersUpsert: counters.error?.message ?? counters.data,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

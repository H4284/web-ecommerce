import { Client } from "pg";

async function main() {
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!password || !url) {
    throw new Error("missing env");
  }
  const ref = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  if (!ref) throw new Error("bad url");

  const hosts = [
    {
      label: "pooler-6543-user-ref",
      cs: `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,
    },
    {
      label: "pooler-5432-user-ref",
      cs: `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`,
    },
    {
      label: "pooler-6543-user-postgres",
      cs: `postgresql://postgres:${encodeURIComponent(password)}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,
    },
  ];

  for (const h of hosts) {
    const client = new Client({
      connectionString: h.cs,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 20000,
    });
    try {
      await client.connect();
      const r = await client.query(
        "select current_database() as db, current_user as usr",
      );
      console.log(h.label, "OK", JSON.stringify(r.rows[0]));
      await client.end();
      return;
    } catch (err) {
      const e = err as Error & { code?: string };
      console.log(h.label, "FAIL", e.code ?? "", e.message);
      try {
        await client.end();
      } catch {
        // ignore
      }
    }
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

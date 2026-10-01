/**
 * Apply one SQL file. Usage:
 * pnpm run:local scripts/supabase-apply-file.ts supabase/migrations/20261001120100_grants.sql
 */
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

async function main() {
  const rel = process.argv[2];
  if (!rel) {
    console.error("Usage: scripts/supabase-apply-file.ts <path.sql>");
    process.exit(1);
  }
  const password = process.env.SUPABASE_DB_PASSWORD!.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const ref = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)![1];
  const file = path.resolve(rel);
  const sql = fs.readFileSync(file, "utf8");

  const client = new Client({
    host: "aws-1-eu-west-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    user: `postgres.${ref}`,
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });

  await client.connect();
  try {
    console.log(`Applying ${path.basename(file)} …`);
    await client.query(sql);
    console.log("OK");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

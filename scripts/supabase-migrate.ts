/**
 * Apply supabase/migrations/*.sql using SUPABASE_DB_PASSWORD.
 * Usage: pnpm run:local scripts/supabase-migrate.ts
 */
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

async function main() {
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!password || !url) {
    console.error("Need SUPABASE_DB_PASSWORD and NEXT_PUBLIC_SUPABASE_URL");
    process.exit(1);
  }
  const ref = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  if (!ref) {
    console.error("Bad NEXT_PUBLIC_SUPABASE_URL");
    process.exit(1);
  }

  // Session/transaction pooler — this project is on aws-1-eu-west-1 (probed).
  const candidates: ConstructorParameters<typeof Client>[0][] = [
    {
      host: "aws-1-eu-west-1.pooler.supabase.com",
      port: 6543,
      database: "postgres",
      user: `postgres.${ref}`,
      password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 20000,
    },
    {
      host: "aws-0-eu-west-1.pooler.supabase.com",
      port: 6543,
      database: "postgres",
      user: `postgres.${ref}`,
      password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 20000,
    },
  ];

  const dir = path.join(process.cwd(), "supabase", "migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let lastError: unknown;
  for (const config of candidates) {
    const client = new Client(config);
    try {
      await client.connect();
      for (const file of files) {
        const sql = fs.readFileSync(path.join(dir, file), "utf8");
        console.log(`Applying ${file} …`);
        await client.query(sql);
        console.log(`OK ${file}`);
      }
      await client.end();
      return;
    } catch (err) {
      lastError = err;
      try {
        await client.end();
      } catch {
        // ignore
      }
      console.warn("Connection attempt failed, trying next host…");
    }
  }
  throw lastError;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

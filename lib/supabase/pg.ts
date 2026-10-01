import "server-only";
import { Client } from "pg";

/** Direct Postgres client for multi-statement transactions (service DB password). */
export function createPgClient(): Client {
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!password || !url) {
    throw new Error("Need SUPABASE_DB_PASSWORD and NEXT_PUBLIC_SUPABASE_URL");
  }
  const ref = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  if (!ref) throw new Error("Bad NEXT_PUBLIC_SUPABASE_URL");

  return new Client({
    host: "aws-1-eu-west-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    user: `postgres.${ref}`,
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });
}

import { readFileSync } from "node:fs";
import { createPgClient } from "@/lib/supabase/pg";

async function main() {
  const file = process.argv[2];
  if (!file) {
    throw new Error("Usage: pnpm run:local scripts/apply-sql.ts <path.sql>");
  }
  const sql = readFileSync(file, "utf8");
  const client = createPgClient();
  await client.connect();
  try {
    await client.query(sql);
    console.log("ok", file);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { Client } from "pg";

async function main() {
  const password = process.env.SUPABASE_DB_PASSWORD!.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const ref = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)![1];

  const regions = [
    "eu-west-1",
    "eu-west-2",
    "eu-central-1",
    "us-east-1",
  ];

  const attempts: { label: string; config: ConstructorParameters<typeof Client>[0] }[] = [];

  for (const region of regions) {
    for (const aws of ["aws-0", "aws-1"]) {
      for (const port of [6543, 5432]) {
        attempts.push({
          label: `${aws}-${region}:${port}`,
          config: {
            host: `${aws}-${region}.pooler.supabase.com`,
            port,
            database: "postgres",
            user: `postgres.${ref}`,
            password,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 10000,
          },
        });
      }
    }
  }

  for (const a of attempts) {
    const client = new Client(a.config);
    try {
      await client.connect();
      const r = await client.query("select 1 as ok");
      console.log("SUCCESS", a.label, r.rows[0]);
      await client.end();
      return;
    } catch (err) {
      const e = err as Error & { code?: string };
      console.log("FAIL", a.label, e.message.slice(0, 120));
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

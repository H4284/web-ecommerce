/**
 * Creates the daily Firestore backup schedule on sanem-prod.
 * Needs Owner (or equivalent) on the production project.
 *
 * Usage: node scripts/create-backup-schedule.mjs
 */
import { spawnSync } from "node:child_process";

const project = "sanem-prod";

// Emulator env makes the CLI prompt and can block non-interactive runs.
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_FIRESTORE_EMULATOR_HOST;

function run(args) {
  console.log(`> firebase ${args.join(" ")}`);
  // Avoid shell:true so Windows PowerShell does not eat "(default)".
  const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const result = spawnSync(
    pnpm,
    ["exec", "firebase", ...args, "--non-interactive"],
    { stdio: "inherit", shell: false, env: process.env },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run([
  "firestore:backups:schedules:create",
  "--database",
  "(default)",
  "--recurrence",
  "DAILY",
  "--retention",
  "28d",
  "--project",
  project,
]);

run(["firestore:backups:schedules:list", "--project", project]);

console.log("Daily backup schedule is on sanem-prod (retention 28d).");

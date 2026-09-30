/**
 * Full e2e under firebase emulators:exec — seed → build → start → Playwright.
 * Env for emulators must already be set by the caller / CI.
 */
import { spawnSync } from "node:child_process";

const e2eEnv = {
  ...process.env,
  GCLOUD_PROJECT: process.env.GCLOUD_PROJECT ?? "demo-sanem",
  FIRESTORE_EMULATOR_HOST:
    process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080",
  FIREBASE_AUTH_EMULATOR_HOST:
    process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099",
  FIREBASE_STORAGE_EMULATOR_HOST:
    process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? "127.0.0.1:9199",
  NEXT_PUBLIC_USE_EMULATORS: "1",
  NEXT_PUBLIC_SITE_URL:
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3010",
  NEXT_PUBLIC_FIREBASE_API_KEY:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "demo-sanem.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-sanem",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "demo-sanem.appspot.com",
  NEXT_PUBLIC_FIREBASE_APP_ID:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "demo-app",
  NEXT_PUBLIC_STORAGE_ORIGIN:
    process.env.NEXT_PUBLIC_STORAGE_ORIGIN ?? "http://127.0.0.1:9199",
  // Empty → Turnstile stub token; verifyTurnstile accepts any without secret.
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
  TURNSTILE_SECRET_KEY: "",
  ORDER_LINK_SECRET:
    process.env.ORDER_LINK_SECRET ?? "e2e-order-link-secret",
  PLAYWRIGHT_BASE_URL:
    process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3010",
  PORT: process.env.PORT ?? "3010",
};

function step(label, command, args) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: e2eEnv,
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

step("seed", "pnpm", ["seed"]);
step("build", "pnpm", ["build"]);
step("playwright", "node", ["scripts/run-e2e.mjs"]);

/**
 * Start Next.js, wait for ready, run Playwright, then stop the server.
 * Expects: emulators up, seed done, `pnpm build` already run, e2e env set.
 * Uses the standalone server (next.config `output: "standalone"`).
 */
import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const ROOT = process.cwd();
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3010";
const STANDALONE = join(ROOT, ".next", "standalone");

function prepareStandalone() {
  if (!existsSync(join(STANDALONE, "server.js"))) {
    throw new Error("Missing .next/standalone/server.js — run pnpm build first");
  }
  const staticDest = join(STANDALONE, ".next", "static");
  mkdirSync(staticDest, { recursive: true });
  cpSync(join(ROOT, ".next", "static"), staticDest, { recursive: true });
  if (existsSync(join(ROOT, "public"))) {
    cpSync(join(ROOT, "public"), join(STANDALONE, "public"), { recursive: true });
  }
}

async function waitForServer(url, ms = 120_000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // not up yet
    }
    await sleep(500);
  }
  throw new Error(`Server did not become ready at ${url}`);
}

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env,
      shell: true,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

async function main() {
  prepareStandalone();

  const env = {
    ...process.env,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
    TURNSTILE_SECRET_KEY: "",
    PORT: process.env.PORT ?? "3010",
    HOSTNAME: "127.0.0.1",
  };

  const server = spawn("node", ["server.js"], {
    cwd: STANDALONE,
    stdio: "inherit",
    env,
    shell: true,
  });

  let exitCode = 1;
  try {
    await waitForServer(BASE);
    await run("pnpm", ["exec", "playwright", "test"], env);
    exitCode = 0;
  } catch (err) {
    console.error(err);
    exitCode = 1;
  } finally {
    if (server.pid) {
      try {
        if (process.platform === "win32") {
          spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
            stdio: "ignore",
            shell: true,
          });
        } else {
          process.kill(-server.pid, "SIGTERM");
        }
      } catch {
        try {
          process.kill(server.pid);
        } catch {
          // already gone
        }
      }
    }
  }
  process.exit(exitCode);
}

main();

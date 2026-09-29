# Recipe — ecommerce (Next.js server app on Firebase App Hosting)

Verified 2026-09-28 against the Firebase App Hosting docs (configure, costs, rollouts), the App Hosting
Next.js starter, the Emulator Suite install docs, the Next.js 16 docs and release notes (sources:
`docs/adr/0007`). The first real shop runs it end to end. A command that behaves differently →
check the docs (Context7), fix this file, date the fix, say so in the hand-off.

## 0. Before you start (once per shop)

1. **Java JDK 21** on your machine (`java -version`). The Firestore emulator needs JDK 11 or newer.
   Windows: the Temurin 21 installer from adoptium.net, then open a new terminal.
2. **Staging project** `<slug>-staging` in Thrio's Google account (Firebase console):
   - Blaze plan and a **budget alert of 5 €** (Google Cloud → Billing → Budgets).
   - Firestore in Native mode, location **`europe-west4`**. The location is permanent.
   - Authentication: Email/Password on; Google only if the plan says so.
   - Storage: default bucket in `europe-west4` (a few cents a month; the free storage tier is US-only).
   - Project settings → Your apps → add a web app. Keep the config values for step 4.
3. **Production project** `<slug>-prod` in the **client's** Google account, same settings, Thrio as
   Owner. Create it before `/ship` at the latest.
4. **Google Cloud CLI**, only for scripts that run against staging or production (`set-admin`,
   `import-products`): `gcloud auth application-default login`, then once per project
   `gcloud auth application-default set-quota-project <project-id>`.

## 1. Create the app

```bash
pnpm create next-app@latest <slug> --ts --eslint --tailwind --app --no-src-dir --import-alias "@/*" --use-pnpm
cd <slug>
pnpm add firebase firebase-admin server-only zod zustand react-hook-form @hookform/resolvers resend @react-email/components sharp react-markdown @tanstack/react-table motion clsx tailwind-merge class-variance-authority lucide-react
pnpm add -D firebase-tools vitest @firebase/rules-unit-testing @playwright/test tsx culori apca-w3
pnpm exec playwright install chromium
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input label badge card dialog sheet select radio-group checkbox skeleton command carousel sonner table form
pnpm exec firebase login
```

pnpm lists ignored build scripts (for example `sharp`, `protobufjs`) → run `pnpm approve-builds` and
approve `sharp`. Windows: pnpm symlink `EPERM` → turn on Developer Mode, as in `recipe-static.md`.
Delete the generated `app/page.tsx` — the home page lives in `app/(site)/page.tsx`.

## 2. `next.config.ts`

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone",                                        // App Hosting needs .next/standalone
  images: { loader: "custom", loaderFile: "./lib/images/loader.ts" },
  experimental: { serverActions: { bodySizeLimit: "11mb" } },  // image uploads up to 10 MB
};
export default nextConfig;
```

`next start` prints a warning about `standalone`. That is expected for local checks.

`lib/images/loader.ts` — product and home images are pre-sized at upload (`code-firebase.mdc` → Images):

```ts
const WIDTHS = [320, 640, 960, 1280];
const ORIGIN = process.env.NEXT_PUBLIC_STORAGE_ORIGIN ?? "https://firebasestorage.googleapis.com";
const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

// src "products/<id>/<n>" → the smallest pre-sized WebP that is at least as wide as asked (max 1280).
// Anything else (files in public/, absolute URLs) is returned as it is.
export default function loader({ src, width }: { src: string; width: number }) {
  if (!src.startsWith("products/") && !src.startsWith("content/")) return src;
  const w = WIDTHS.find((x) => x >= width) ?? 1280;
  return `${ORIGIN}/v0/b/${BUCKET}/o/${encodeURIComponent(`${src}-${w}.webp`)}?alt=media`;
}
```

## 3. Firebase files

`firebase.json`:

```json
{
  "firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" },
  "storage": { "rules": "storage.rules" },
  "emulators": {
    "auth": { "port": 9099 }, "firestore": { "port": 8080 }, "storage": { "port": 9199 },
    "ui": { "enabled": true, "port": 4000 }, "singleProjectMode": true
  }
}
```

`.firebaserc`: `{ "projects": { "default": "demo-<slug>", "staging": "<slug>-staging", "prod": "<slug>-prod" } }`

`firestore.rules` — deny-all, and it stays that way (the browser never talks to Firestore):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if false; }
  }
}
```

`storage.rules` — anyone can get a product or home image; nobody can list or write:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} { allow get: if true; }
    match /content/{allPaths=**} { allow get: if true; }
  }
}
```

`firestore.indexes.json`: `{ "indexes": [], "fieldOverrides": [] }`.

`lib/firebase/admin.ts`:

```ts
import "server-only";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// App Hosting injects FIREBASE_CONFIG. Locally the emulator variables in .env.local are used.
const app = getApps()[0] ?? (process.env.FIREBASE_CONFIG
  ? initializeApp()
  : initializeApp({ projectId: process.env.GCLOUD_PROJECT, storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }));

export const db = getFirestore(app);
export const adminAuth = getAuth(app);
export const getBucket = () => getStorage(app).bucket(); // a function: CI builds have no bucket name
```

`lib/firebase/client.ts` (import it only from client components):

```ts
import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

const app = getApps()[0] ?? initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
export const auth = getAuth(app);
if (process.env.NEXT_PUBLIC_USE_EMULATORS === "1" && !auth.emulatorConfig) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}
```

`.env.local` (ignored) for the emulators:

```
GCLOUD_PROJECT=demo-<slug>
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199
NEXT_PUBLIC_USE_EMULATORS=1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_FIREBASE_API_KEY=demo-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-<slug>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-<slug>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-<slug>.appspot.com
NEXT_PUBLIC_FIREBASE_APP_ID=demo-app
NEXT_PUBLIC_STORAGE_ORIGIN=http://127.0.0.1:9199
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
ORDER_LINK_SECRET=local-only-change-me
```

## 4. `apphosting.yaml` + one file per environment

`apphosting.yaml` (shared, committed):

```yaml
runConfig:
  minInstances: 0          # 1 in production removes cold starts but costs money — ask the client
  maxInstances: 4
  concurrency: 80
  cpu: 1
  memoryMiB: 1024          # sharp resizes uploads in memory
env:
  - variable: RESEND_API_KEY
    secret: resendApiKey
  - variable: TURNSTILE_SECRET_KEY
    secret: turnstileSecretKey
  - variable: ORDER_LINK_SECRET
    secret: orderLinkSecret
```

`apphosting.staging.yaml` and `apphosting.production.yaml` (committed; public values only):

```yaml
env:
  - variable: NEXT_PUBLIC_SITE_URL
    value: https://<the backend URL or the domain>
    availability:
      - BUILD
      - RUNTIME
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    value: <slug>-staging
    availability:
      - BUILD
      - RUNTIME
  # the same for NEXT_PUBLIC_FIREBASE_API_KEY, _AUTH_DOMAIN, _STORAGE_BUCKET, _APP_ID,
  # NEXT_PUBLIC_TURNSTILE_SITE_KEY, and later NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_META_PIXEL_ID
```

Create each secret once per project: `pnpm exec firebase apphosting:secrets:set resendApiKey --project staging`.
Accept when the CLI offers to grant the backend access. Missed it →
`pnpm exec firebase apphosting:secrets:grantaccess resendApiKey --backend <backend-id> --project staging`.

## 5. Scripts (`package.json`) and Vitest

```json
"dev": "next dev",
"emulators": "firebase emulators:start --project demo-<slug> --import=.emulator-data --export-on-exit",
"seed": "tsx --conditions=react-server --env-file-if-exists=.env.local scripts/seed.ts",
"run:local": "tsx --conditions=react-server --env-file-if-exists=.env.local",
"run:remote": "tsx --conditions=react-server",
"typecheck": "tsc --noEmit",
"lint": "eslint .",
"test": "vitest run tests/unit",
"test:rules": "firebase emulators:exec --only firestore,storage --project demo-<slug> \"vitest run tests/rules\"",
"test:emulator": "firebase emulators:exec --only auth,firestore,storage --project demo-<slug> \"vitest run --passWithNoTests tests/emulator\"",
"e2e": "playwright test",
"build": "next build",
"start": "next start"
```

`--conditions=react-server` turns `import "server-only"` into an empty import for scripts.
`--env-file-if-exists` (Node 22.9+) lets CI pass the same values as environment variables. Examples:
`pnpm run:local scripts/verify-catalog.ts` (emulator) ·
`pnpm run:remote scripts/set-admin.ts ana@client.com --project <slug>-staging` (real project).

`scripts/lib/remote.ts` — every script that may run against a real project starts with it:

```ts
// Call before importing "@/lib/firebase/admin". Returns true when --project was given.
export function setRemoteProject(argv: string[]): boolean {
  const i = argv.indexOf("--project");
  if (i < 0) return false;
  const emulator = Object.keys(process.env).find((k) => k.endsWith("_EMULATOR_HOST"));
  if (emulator) throw new Error(`${emulator} is set — refusing to write to a real project`);
  const projectId = argv[i + 1];
  const storageBucket = process.env.STORAGE_BUCKET ?? `${projectId}.firebasestorage.app`; // check: Firebase console → Storage
  process.env.FIREBASE_CONFIG = JSON.stringify({ projectId, storageBucket });
  return true;
}
// in a script: setRemoteProject(process.argv); const { db, adminAuth } = await import("@/lib/firebase/admin");
```

`vitest.config.ts`, and `tests/empty.ts` with `export {};`:

```ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  resolve: { alias: { "@": root, "server-only": path.join(root, "tests", "empty.ts") } },
});
```

`.gitignore` adds `.emulator-data/` (logs are already ignored).

## 6. Skeleton

The folders from `code-firebase.mdc` → Shape, plus the shared files of every layer:

```
app/(site)/layout.tsx · app/(site)/page.tsx   placeholder shell (real one: /build shell); layout: dynamic = "force-dynamic"
app/admin/layout.tsx                          dynamic = "force-dynamic"; calls requireAdmin() — a stub that denies everyone for now
app/not-found.tsx                             static, no Firestore (the branded 404 comes later in app/(site)/not-found.tsx)
app/sitemap.ts · app/robots.ts
content/site.ts                               name, NAP, phone, WhatsApp, email, nav, social
lib/shop/money.ts                             formatCents(cents) with Intl.NumberFormat("sq-XK", EUR)
lib/shop/auth.ts                              getUser / requireUser / requireAdmin (stubs until shop:auth)
scripts/seed.ts                               writes meta/seed { at } to prove the emulator link
tests/unit/money.test.ts                      one test for formatCents
tests/rules/firestore.test.ts                 an anonymous and a signed-in client can neither read nor write `meta`
public/og.png                                 placeholder labelled "OG — replace"
```

## 7. CI (`.github/workflows/ci.yml`)

```yaml
name: ci
on: [pull_request, push]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: "21" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck && pnpm lint && pnpm test && pnpm build
      - run: pnpm test:rules
      - run: pnpm test:emulator
```

## 8. Staging backend (after the first push to GitHub)

1. `pnpm exec firebase apphosting:backends:create --project staging` → region `europe-west4`,
   connect the GitHub repo, root directory `/`, live branch `main`, automatic rollouts on.
   If the CLI or the console offers to deploy now, say **no**.
2. Backend → Settings → Environment name: `staging`.
3. Create the three secrets (step 4). Deploy rules and indexes:
   `pnpm exec firebase deploy --only firestore,storage --project staging`.
4. Only now push to `main` (or create a rollout). Put the staging URL in `plan.md` → Ops.

## 9. Verify

```bash
pnpm emulators          # terminal 1 — Emulator UI on http://127.0.0.1:4000
pnpm seed               # terminal 2 — meta/seed appears in the Emulator UI
pnpm dev                # http://localhost:3000 shows the placeholder shell
pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm start
# stop `pnpm emulators` first (Ctrl+C) — these two start their own emulators on the same ports:
pnpm test:rules && pnpm test:emulator
```

The staging URL serves `/` after the first rollout. `/admin` denies access.

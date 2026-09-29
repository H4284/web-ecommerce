# Recipe — static site (landing, multipage; also the `web/` part of cms)

Verified 2026-09-27 against the Next.js static-export docs and the Cloudflare Workers static-assets
docs. Written after two practice runs hit OpenNext / vinext / workerd friction; this path has no
server bundle. A command that behaves differently → check the docs MCP, fix this file, date the fix.

## 1. Create the app

```bash
pnpm create next-app@latest <slug> --ts --eslint --tailwind --app --no-src-dir --import-alias "@/*" --use-pnpm
cd <slug>
pnpm add motion clsx tailwind-merge class-variance-authority lucide-react zod resend
pnpm add -D wrangler @playwright/test culori apca-w3
pnpm exec playwright install chromium
pnpm dlx shadcn@latest init        # style default · base neutral · CSS variables yes
```

Windows: if pnpm reports symlink `EPERM`, enable Developer Mode (Settings → For developers) or run
`pnpm config set node-linker hoisted` for this machine. No Docker or WSL is needed on this path.

## 2. `next.config.ts`

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { loader: "custom", loaderFile: "./lib/cf-image-loader.ts" },
};
export default nextConfig;
```

`lib/cf-image-loader.ts`:

```ts
export default function cfLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (process.env.NODE_ENV === "development" || src.startsWith("data:")) return src;
  return `/cdn-cgi/image/width=${width},quality=${quality ?? 80},format=auto${src.startsWith("/") ? src : `/${src}`}`;
}
```

## 3. `wrangler.jsonc` + the forms Worker

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "<slug>",
  "compatibility_date": "2025-09-01",
  "main": "src/worker.ts",
  "assets": { "directory": "./out", "not_found_handling": "404-page", "html_handling": "auto-trailing-slash",
              "run_worker_first": ["/api/*"] }
}
```

`src/worker.ts` — one `fetch` handler: `POST /api/contact` → honeypot (return `{ ok: true }` at once
if filled) → Turnstile `siteverify` → `zod` parse → Resend `POST https://api.resend.com/emails` →
`{ ok: true }`. Any other path → `env.ASSETS.fetch(request)`. Secrets via `env`
(`TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `CONTACT_TO`); `.dev.vars` locally.

## 4. Scripts (`package.json`)

```json
"dev": "next dev",
"typecheck": "tsc --noEmit",
"lint": "eslint .",
"build": "next build",
"preview": "pnpm build && wrangler dev",
"deploy": "pnpm build && wrangler deploy",
"cf-typegen": "wrangler types"
```

ESLint: ignore `out/`. `.gitignore`: `out/`, `.wrangler/`, `.dev.vars`, `.env*.local`.
Fixed 2026-09-28: `next lint` was removed in Next.js 16 — `lint` runs ESLint directly.

## 5. Tokens and skeleton

`app/globals.css`: `@import "tailwindcss";` then the `@theme { … }` block from `DESIGN.md`.

```
app/(site)/layout.tsx        header + footer + skip link (placeholder text)
app/(site)/page.tsx          <main> with one <h1> from content/home.ts
app/not-found.tsx · app/sitemap.ts · app/robots.ts
components/layout/{header,footer,skip-link}.tsx · components/ui/ (shadcn)
content/site.ts              name, NAP, phone, whatsapp, email, nav, social, locales
content/home.ts              copy-lock keys as typed strings
lib/cn.ts · lib/cf-image-loader.ts · lib/contact-schema.ts (zod, shared with the Worker)
public/og.png                placeholder labelled "OG — replace"
.env.example                 RESEND_API_KEY · TURNSTILE_SECRET_KEY · CONTACT_TO · NEXT_PUBLIC_TURNSTILE_SITE_KEY · NEXT_PUBLIC_CF_BEACON_TOKEN
```

## 6. Verify

```bash
pnpm typecheck && pnpm lint && pnpm build && pnpm preview     # open the printed URL: / and /api/contact (405 on GET is fine)
```

## 7. Multipage additions

One folder per Sitemap route under `app/(site)/<route>/page.tsx` with `metadata`, `content/<route>.ts`,
nav entries in `content/site.ts`; `sitemap.ts` reads the route list from `content/site.ts`.

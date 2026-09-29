# Recipe — cms (static `web/` + standalone Sanity Studio `studio/`)

Verified 2026-09-27 against the Sanity MCP rules `nextjs`, `project-structure`, `get-started`.
Load those rules before you run this. Run `recipe-static.md` first with `<slug>` = `web`.

## 0. Layout

```
<repo>/
├── web/       Next.js static export (recipe-static.md) + next-sanity for build-time fetching
├── studio/    Sanity Studio (Vite), deployed with `sanity deploy`
├── pnpm-workspace.yaml   packages: ["web", "studio"]
└── package.json          root scripts that delegate to both
```

## 1. Studio (from the repo root, never inside `web/`)

```bash
pnpm create sanity@latest -- --create-project "<Client name>" --dataset production --template clean --typescript --output-path studio
# existing project: --project <projectId> instead of --create-project
cd studio && pnpm dev            # http://localhost:3333
```

The Sanity project owner is the **client's** email (`plan.md` → cms addendum); invite Thrio as admin.

## 2. Web ↔ Sanity (`web/src/sanity/`)

```bash
cd web && pnpm add next-sanity @sanity/client @sanity/image-url
```

```
env.ts        NEXT_PUBLIC_SANITY_PROJECT_ID · NEXT_PUBLIC_SANITY_DATASET · SANITY_API_READ_TOKEN (build only)
client.ts     createClient({ projectId, dataset, apiVersion: "2026-02-01", useCdn: false })
queries.ts    defineQuery(...) — PAGE_QUERY, SITE_SETTINGS_QUERY, SLUGS_QUERY
image.ts      imageUrlBuilder(client)
```

Pages fetch at build time; `generateStaticParams` from `SLUGS_QUERY` with `perspective: "published"`.

## 3. Schema and types

`/build schema:settings`, then `schema:page`, then one `schema:<block>` per block in `plan.md`.
After each: `cd studio && pnpm sanity typegen generate` (`sanity-typegen.json` points `path` at
`../web/src/**/*.{ts,tsx}` and writes `../web/src/sanity/types.ts`).

## 4. Rebuild on publish

Sanity Manage → API → Webhooks: filter `_type in ["page","siteSettings", …]`, trigger on publish,
URL = the deploy hook (Cloudflare, if Workers Builds offers one) or a GitHub `repository_dispatch`
endpoint driven by a GitHub Actions workflow that runs `pnpm build && wrangler deploy`
(`code-cloudflare.mdc` → Deploy). Test it once: publish → site changes within a few minutes.

## 5. Deploy the Studio

```bash
cd studio && pnpm sanity deploy      # → <slug>.sanity.studio
```

## 6. Verify

`web`: `pnpm typecheck && pnpm lint && pnpm build && pnpm preview`. `studio`: `pnpm build`.
A page created in the Studio appears on the site after the rebuild.

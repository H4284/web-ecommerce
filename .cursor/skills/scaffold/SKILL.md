---
name: scaffold
description: Creates the code skeleton for the plan's layer — Next.js static export + Tailwind v4 + the small forms Worker on Cloudflare, a standalone Sanity Studio for cms, or a Next.js server app on Firebase App Hosting for shops — from a verified starter or the dated recipe. Runs typecheck, build and preview before it commits. Use once per project after Gate 1.
---

# /scaffold — code skeleton

## Gate

1. `Status: Planned`. Code already exists (`package.json`) → stop; use `/build`.
2. Layer is `landing`, `multipage`, `cms` or `ecommerce`. `dashboard` → stop (`docs/notes/later-layers.md`).
3. Read `01-stack.mdc`, `code-next.mdc`, `code-cloudflare.mdc`; cms also `code-sanity.mdc` and the
   Sanity MCP rules `get-started`, `project-structure`; ecommerce `layer-ecommerce.mdc` and
   `code-firebase.mdc` instead of `code-cloudflare.mdc`.
4. ecommerce: the shop addendum is filled (no `[REQUIRED]`), the staging Firebase project exists,
   Java 21 is installed. Missing → name it, stop.

## Steps

1. **Starter or recipe.** `node .cursor/brain/brain.mjs starter <layer>`. Exit 0 → copy
   `.tmp-starter/` into place, rename the app in `package.json` and `wrangler.jsonc`, delete
   `.tmp-starter/`. Exit 3 → follow `.cursor/skills/scaffold/references/recipe-static.md` (cms: then
   `.cursor/skills/scaffold/references/recipe-cms.md`; ecommerce: only
   `.cursor/skills/scaffold/references/recipe-ecommerce.md`), command by command. A command that
   behaves differently → check Context7 / the docs MCP, fix the recipe file, date the fix, and say so
   in the hand-off.
2. **Tokens.** Move the `@theme` block from `DESIGN.md` into `app/globals.css`.
3. **Project files.** `content/site.ts` with name, NAP, **phone and WhatsApp numbers**, nav, social
   from `plan.md` · `app/not-found.tsx`, `sitemap.ts`, `robots.ts` · `public/og.png` labelled
   "OG — replace" · `.env.example` (names only) · `.github/PULL_REQUEST_TEMPLATE.md` from
   `.cursor/brain/templates/.github/`.
4. **Verify.** `pnpm typecheck && pnpm lint && pnpm build && pnpm preview` — `/` served from `out/`.
   `pnpm exec playwright install chromium` done once. cms: `studio` builds, `sanity typegen generate` runs.
   ecommerce: recipe step 9 — emulators up, `pnpm seed` works, `pnpm test` green, `pnpm start` serves `/`.
5. **Commit.** Branch `chore/scaffold`, commit `chore(scaffold): <layer> skeleton`. Remote exists →
   push, draft PR, ask the user once to connect Workers Builds and paste the preview URL (ecommerce:
   create the staging backend, recipe step 8, and paste the staging URL). No remote → say so, continue.
6. Say: "Next: `/build shell`." Shops: "Next: `/build shop:catalog-model`" — the shell needs the
   catalog (unit 3) for its category menu.

## Do not

Add UI bands (scaffold is chrome-free) · pick another framework, host or package manager · embed the
Studio · skip `pnpm preview`.

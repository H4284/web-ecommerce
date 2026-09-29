# Test Client — website

| | |
|---|---|
| Layer / Status | see `plan.md` |
| Brain | `brain.lock` — managed files come from `github.com/kentech01/cursor-brain` |
| ClickUp · Repo · Preview · Production | [links] |

1. Read `plan.md`. Its `Status:` decides what you may do (`.cursor/rules/00-core.mdc`).
2. Chain: `/kickoff` → `/refs` → `/design` → Gate 1 → `/scaffold` → `/build <unit>` → `/qa` → Gate 2 → `/ship`.
3. Project-only rules: `.cursor/rules/project-*.mdc`. Everything else under `.cursor/` is managed —
   a wrong rule goes into `LESSONS.md`; update with `node .cursor/brain/brain.mjs sync`.

| File | Role |
|---|---|
| `plan.md` | what to build — facts, sitemap, blueprint, decisions |
| `DESIGN.md` | how it looks — direction, tokens, layout plan |
| `LESSONS.md` | failures and the hard stop that prevents each |
| `brief/` | client inputs: brand, copy, photos, reference screenshots |

## Project notes

[anything specific to this client an agent must know]

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

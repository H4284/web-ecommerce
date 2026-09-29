---
name: build
description: Builds exactly one unit — the shell, one band, one page, one schema type, one shop unit, one fix — with tokens, screenshots at 375 and 1440, and a side-by-side check against the reference row (or the unit's Done-when list) before it is shown. Use for any implementation work after Gate 1; the user says build, implement, add section, add page, fix.
---

# /build <unit> — one unit, verified, then shown

## Gate

1. `Status: Planned` or `Building` (or `Shipped` for `fix:*`). Code exists (else `/scaffold`).
2. The unit is named: `shell` · `home:band-N` · `page:<route>` · `schema:<type>` · `shop:<id>` ·
   `fix:<what>`. No name → ask. Never "build everything".
3. Read the blueprint row, Copy lock, `DESIGN.md`, `design.mdc`, `reference-fidelity.mdc`,
   `code-next.mdc`, `site-chrome.mdc`. Band units: open both reference PNGs first; missing → stop.
   A shop feature band uses the PNGs of the band its row names (`feature — archetype of band N`).
   `shop:*` units: read the unit in `.cursor/skills/build/references/shop-units.md`, the shop
   addendum in `plan.md`, `layer-ecommerce.mdc` and `code-firebase.mdc`. Its "Needs" not merged, or
   `In? no` in the Shop build order → stop and say which unit comes first.

## Build order for a site

`shell` → `home:band-1 … N` in blueprint order → `page:/contact` (or the highest-value page) →
remaining routes → cms: `schema:<type>` per type, then collection pages → `/qa`.
Shops: the Index order in `shop-units.md` (home bands after `shop:product-card`) → `/qa`.

## Steps (one unit)

1. Branch `feat/<unit-slug>` (or `fix/…`). ClickUp task id noted if one exists.
2. Say in one line what the unit is, which row, which copy-lock keys.
3. `shell` only: `content/site.ts` phone / WhatsApp / email must be real values — empty → stop and ask.
4. Implement with tokens only. shadcn allowed, restyled. Copy from Copy lock / `content/` / Sanity,
   never from the reference.
5. Quiet quality: responsive, focus states, reduced motion, alt text, scroll-padding for anchors.
6. `pnpm typecheck && pnpm lint && pnpm build` (shops: `pnpm test` too; `pnpm test:rules` when the
   unit adds a collection; `pnpm test:emulator` when it adds emulator tests). Red → fix first.
7. Screenshots with the Playwright MCP at **375 and 1440** → `.qa/build/<unit>-{375,1440}.png`
   (UI units; a server-only shop unit shows its test output instead).
8. Band units: **side by side** with the reference PNGs, column by column of the row
   (media side + aspect, split, alignment, captions, CTA count, mobile behaviour, Do not invent).
   A mismatch → fix and repeat. Do not show a mismatched band. `shop:*` units: check every
   "Done when" line and write the evidence next to it. An open line → fix first.
9. Commit. Remote → push, PR (draft → Ready when the template checklist is done). No remote → say so.
10. Hand-off. First unit sets `Status: Building`.

## Hand-off

```markdown
## Build unit: <unit>
| row column | reference | build | match |
|---|---|---|---|
| media side + aspect | … | … | ✓ |
| split / alignment / captions | … | … | ✓ |
| CTA count + order | … | … | ✓ |
| mobile (375) | … | … | ✓ |
| Do not invent | … | … | ✓ |
typecheck / lint / build: green · screenshots 375 + 1440 attached · PR / preview: … · next unit: …
```

Shop units use the unit's Done-when list instead of the table:

```markdown
## Build unit: shop:<id>
| Done when | evidence | ✓ |
|---|---|---|
| … | test name / screenshot / emulator check | ✓ |
typecheck / lint / test / build: green · rules tests: green / n.a. · PR: … · next unit: …
```

## User says "like this" / "bigger" / "more"

Save the example, measure it, then code. After two vague nudges, ask for a number or a crop.

## Do not

More than one unit per pass · hardcoded values · invent bands · show a unit that fails checks or the
side-by-side · edit files outside the unit · `git push` without a remote (check first).

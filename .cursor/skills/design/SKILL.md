---
name: design
description: Turns the reference blueprint plus the client's brand into tokens and DESIGN.md — OKLCH palette, type pair, Tailwind v4 @theme — writes the Shop build order for online shops, and presents the whole plan for Gate 1. Use after /refs or when the user asks for tokens, palette, typography, design direction.
---

# /design — tokens + `DESIGN.md` → Gate 1

## Gate

1. Blueprint rows filled with measurements (else `/refs`). Shops: the Feature reference table too.
2. Read `plan.md`, `DESIGN.md`, `design.mdc`, `reference-fidelity.mdc`, `LESSONS.md`.
3. Logo in `brief/brand/`? Read it for the palette anchor only.

## Steps

1. **Direction.** One paragraph: what this design is and why it belongs to this business. The five axes.
2. **Principles.** Three decision rules, each able to reject a future choice.
3. **Palette.** OKLCH ramp (`culori`); contrast with `apca-w3`: body 4.5:1, large / UI 3:1. Fill the table.
4. **Type.** Two families max, matching the reference's type roles. Licence noted.
5. **Spacing, radius, elevation, motion.** Section rhythm from the plan. 2–3 signature moments,
   ≤ 2 scroll reveals, tokens for duration and easing.
6. **`@theme`** into `DESIGN.md` → Tokens (`/scaffold` moves it to `globals.css`): color, font,
   spacing, radius, shadow, motion, `--hero-min-height`, `--header-height`.
7. **Layout plan** mirrors the blueprint band order with a spacing token per band. Shops: add the
   shop components to `DESIGN.md` — product card, price with compare-at, stock badge, variant pills,
   cart drawer, checkout summary, admin tables (neutral, same tokens).
8. **Shops only — Shop build order.** Copy the unit list from
   `.cursor/skills/build/references/shop-units.md` into the addendum's Shop build order. Mark units
   the plan does not need `In? no` (e.g. accounts, discounts). `shop:payment-bank` stays blocked
   until Step 0 is `received`. Split the work into two tracks after `shop:rules-tests` and the
   shell: storefront and admin.
9. **Gate 1 — the plan for approval.** One message to the approver:

```markdown
## Plan for approval — <client>
- Layer · industry · one action · conversion channels with numbers
- Reference: <name> · <N> home bands measured · key pages …
- Direction + why · palette anchors · type pair + licence · signature moment
- Sitemap · copy owner · content still missing
- Shops: feature reference · payments + Step 0 status · delivery fees · <N> units in the build order
- Ops: domain, owners, deadline
Approve? (yes / changes)
```

On "yes": `Status: Planned`. Say: "Next: `/scaffold`."

## Do not

Build the system from the logo alone · Inter / Poppins / Roboto unless a logged reference match ·
reorder blueprint bands · write components before `@theme` exists.

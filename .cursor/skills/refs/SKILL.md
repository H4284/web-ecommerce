---
name: refs
description: Picks the reference site from the brain's list for the client's industry (top 5 → the user picks one), screenshots it with the Playwright MCP, measures each band on the live page, and fills the Reference Blueprint in plan.md. For online shops it also walks one live shop in the client's market and writes the feature inventory. Use after kickoff or when the user says references, peers, which site to copy.
---

# /refs — reference pick → blueprint

## Gate

1. `plan.md` has no `[REQUIRED]` outside the blueprint (else `/kickoff`).
2. Playwright MCP is on (Settings → MCP). Off → stop and say so.
3. Read `plan.md` (industry, characteristic thing, not-like list, layer) and `reference-fidelity.mdc`.

## Steps

1. **Load the list.** `.cursor/brain/references/industries/<industry>.md` (+ `<industry>.local.md`
   if present). Filter by layer and by tags that match the characteristic thing; drop anything close
   to the client's "not like" sites. Small local business → prefer rows tagged `local`. A `webgl` row
   is fine only if the client understands the 3D will become photos or video. Fewer than 5 good rows
   → search the galleries in `.cursor/brain/references/README.md`, add candidates to
   `<industry>.local.md`, continue. Shops: also read `ecommerce-dtc.md` and prefer rows with layer
   `ecommerce`.
2. **Top 5.** One line each: why it fits **this** client, what we keep. Wait. The user picks
   (or mixes: "1 for home, 4 for contact"). Never pick for them.
3. **Screenshot pack** with the Playwright MCP at **375 and 1440**: full page + one crop per home band
   (and key pages) → `brief/refs/<ref-slug>/{page}-band-{N}-{375|1440}.png`. Committed.
4. **Measure, do not guess.** For each band read from the live page: media side and aspect ratio,
   column split, text alignment, caption position, CTA count and order, band height class, mobile
   behaviour (stacked? inline? peek?). Fill one blueprint row per band in `plan.md` with the
   **Measurements**, **CTA** and **Do not invent** columns (`reference-fidelity.mdc`).
5. **Asset brief and direction.** Fill the asset brief (`design.mdc` → Assets). Propose one direction
   in 5 lines: layout = blueprint, our colors + type, the reference's shape grammar, one signature
   moment. No fail words.
6. **Shops only — the feature reference.** Follow
   `.cursor/skills/refs/references/feature-inventory.md`: pick one live shop with the user, walk it,
   fill the addendum's Feature reference table.
7. Show the band count, the asset brief and the direction (shops: also the feature inventory).
   On "ok": "Next: `/design`."

## Do not

- Choose the reference for the user. Copy branding, photos, copy or illustrations from it.
- Invent home bands the reference lacks (shops: feature bands only, as `layer-ecommerce.mdc` says).
  Leave a row without measurements or **Do not invent**.
- Take anything from the feature reference except pages, flows, fields, rules and common labels.

---
name: kickoff
description: Runs the client interview as six short rounds (company, goal, audience, brand, pages + layer, ops), plus a shop round for online shops, and fills plan.md. First step of the chain. Use when plan.md has [REQUIRED] fields or the user says kickoff, start, interview, new client, new shop.
---

# /kickoff — interview → `plan.md`

## Gate

1. `plan.md` exists with `Status: Draft`. Later status → gap-fill only, and say which fields you touch.
2. You are in a client project (`brain.lock` exists), not in the brain repo.
3. Read `plan.md`, `AGENTS.md`, `brief/README.md`. There is no code yet — do not look for any.

## How to ask

- **One round per turn.** Ask the round's questions together, wait, then the next round.
- Offer defaults in brackets; "ok" accepts them.
- Never invent client facts. Unknown → `⚠️ CONFIRM WITH CLIENT`. Design unknowns → `TBD after /refs`.
- `plan.md` holds client facts only. No process text.

## Rounds

1. **Company** — client name · what they do in one line · city / country · industry from
   `.cursor/brain/references/reference-list.md` (name the closest) · website today (URL / none).
2. **Goal and conversion** — the one action a visitor takes · channels (phone / WhatsApp / email / form /
   booking / visit) · **the actual phone and WhatsApp numbers** for every channel that is on (a practice
   site shipped a Reserve button that called nothing) · CTA label · where a form delivers.
3. **Audience and language** — 2–3 personas in one line each · language(s) [default Albanian] · tone in 3 adjectives.
4. **Brand** — logo? (SVG into `brief/brand/`) · colors / fonts or none · the characteristic thing this
   site must express · 2 sites they like · 2 sites they must **not** look like.
5. **Pages, content, layer** — pages [propose from the industry file] · who writes copy · photos on
   hand? · will the client edit content? · will the client **sell online**? → propose the layer:
   `landing` (one page) · `multipage` (≤ 8 pages, Thrio edits) · `cms` (client edits, or > 12
   collection items) · `ecommerce` (catalog, cart, checkout, orders, admin). One sentence each on
   price and time. Wait for the choice.
6. **Ops** — domain (owned? registrar?) · who owns Cloudflare / GitHub / Sanity / Firebase after
   launch · deadline · ClickUp list.
7. **Shop** (`ecommerce` only) — the addendum's tables in two turns: (a) catalog, payments,
   delivery; (b) orders, customers and promotions, admin content, legal and tracking, owners.
   Card payment on → give the client the Step 0 list the same day. It takes weeks at the bank.

## Fill `plan.md`

Overview · Conversion (with numbers) · Sitemap · Brand · Copy lock keys · Content checklist · Ops ·
Decisions (empty). Layer `cms` → append `.cursor/skills/kickoff/assets/plan-addendum-cms.md` and fill it.
Layer `ecommerce` → append `.cursor/skills/kickoff/assets/plan-addendum-ecommerce.md` and fill it
from round 7. The Feature reference and the Shop build order stay empty until `/refs` and `/design`.
Blueprint stays empty until `/refs`. Status stays `Draft`.

## Done when

No `[REQUIRED]` left except the blueprint · the user has seen the filled plan · you say:
"Next: `/refs` to pick the reference site." (Gate 1 comes after `/design`, not here.)

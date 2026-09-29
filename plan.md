# plan.md — Test Client

| | |
|---|---|
| Status | `Draft` |
| Layer | [REQUIRED: landing / multipage / cms / ecommerce] |
| QA | — |
| Updated | 2026-09-29 |

`[REQUIRED]` blocks the build. `⚠️ CONFIRM WITH CLIENT` = assumed. Status rules: `.cursor/rules/00-core.mdc`.

## Overview

| Field | Value |
|---|---|
| Client · what they do · city | [REQUIRED] |
| Industry (reference list) | [REQUIRED] |
| Current website | [REQUIRED: URL / none] |
| The one action a visitor takes | [REQUIRED] |
| Audience (2–3 personas) | [REQUIRED] |
| Language(s) · tone (3 adjectives) | [REQUIRED] |
| The characteristic thing this design must express | [REQUIRED] |

## Conversion

| Channel | On? | Value |
|---|---|---|
| Phone | [REQUIRED] | [number] |
| WhatsApp | [REQUIRED] | [number] |
| Email | [REQUIRED] | [address] |
| Form | [REQUIRED] | delivers to: … |
| Booking / visit | [REQUIRED] | [URL / address] |

Primary CTA label: [REQUIRED — sentence case]

## Sitemap (`landing` = one row)

| Page | Route | Status live / hidden / deferred | Visitor action | Copy owner |
|---|---|---|---|---|
| Home | `/` | live | [REQUIRED] | [REQUIRED] |
| 404 | — | live | back to home | Thrio |

## Brand

Logo (SVG in `brief/brand/`): [REQUIRED] · colors / fonts: [REQUIRED or none] ·
likes: [REQUIRED: 2 sites] · must **not** look like: [REQUIRED: 2 sites] · section rhythm: Alternating (default)

## Reference (filled by `/refs`)

Reference site: [name + URL] · screenshots: `brief/refs/<slug>/` · grammar to keep: …

| # | Band + archetype | Measurements (side, aspect, split, alignment, captions, mobile) | CTA | Do not invent |
|---|---|---|---|---|
| 1 | | | | |

Key pages: repeat the table per page.

Asset brief: icons Lucide · photos … · cutouts … · illustrations … · motion moments …

## Copy lock

| Key | Locked copy |
|---|---|
| `brand.name` | [REQUIRED] |
| `nav.primaryCta` | [REQUIRED — same as the CTA label] |
| `home.hero.headline` | TBD |
| `home.hero.subline` | TBD |
| `contact.form.submit` | [REQUIRED if form] |

## Content checklist (Pending → Received → Approved)

| Asset | Who | Status |
|---|---|---|
| Logo SVG | Client | Pending |
| NAP, hours, social, phone, WhatsApp | Client | Pending |
| Copy per page | [REQUIRED] | Pending |
| Photos | Client | Pending |
| Privacy page | Thrio | Pending |

## Ops

Domain (owner, registrar): [REQUIRED] · GitHub repo: [REQUIRED] · Cloudflare account: [REQUIRED] ·
Sanity project (cms): … · Firebase projects + staging URL (ecommerce): … · form inbox: [REQUIRED if form] ·
deadline: [REQUIRED] · ClickUp: [REQUIRED]

Handover after launch — domain / Cloudflare / GitHub / Sanity / Firebase owner: [REQUIRED]

## Decisions

| Date | Decision | Why |
|---|---|---|
| | | |

## Out of scope

Pages beyond the Sitemap · languages beyond Overview · a higher layer · migrating an old CMS ·
copywriting and photography unless Copy owner says Thrio · SEO / marketing after launch · paid fonts.

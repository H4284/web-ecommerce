# References — the list `/refs` picks from

The best real websites, grouped by industry, for one job: pick a layout to follow for a client.
`/refs` reads this list first. Open-web research is the fallback.

Status 2026-09-27: **278 sites in 26 industries** (`reference-list.md`). Built from Awwwards winners
(Site of the Day, Honorable Mention, Developer Award, Site of the Month, mostly 2025–2026), other
galleries (CSS Design Awards, Godly, Lapa Ninja, One Page Love, SaaS Landing Page), Ken's list, and
the first seed list — minus 58 seeds that were portals, apps, generic corporate sites or rebranded.

## Files

```
references/
├── README.md               this file
├── reference-list.md       index: industries, counts, links
├── industries/<slug>.md    one table per industry
└── screenshots/            optional, not synced to projects
```

## One row

| Column | Meaning |
|---|---|
| Site | business name |
| URL | home page |
| Layer | smallest layer that can rebuild it: `landing` · `multipage` · `cms` · `ecommerce` · `dashboard` |
| Tags | 3–5 words from the list below |
| Notes | one line: the layout move worth taking, plus any warning |
| Source | where the quality claim comes from, e.g. `Awwwards SOTD 2026-09-11`, `Ken's list`, `Thrio seed` |
| Checked | the date we saw the site live (search result, fetch, or a same-year award); `—` = not checked this round |

Tags and notes come from award listings and a quick look, not a full audit. That is fine: `/refs`
opens every picked site with Playwright and **measures** it before anyone builds from it.

**Tags:** `local` (fits a small local business — prefer these for SME clients) · `booking` · `menu` ·
`map` · `floorplans` · `ai` · `case-studies` · `type-led` · `photo-led` · `video-hero` · `full-bleed` ·
`split-hero` · `grid` · `bento` · `carousel` · `one-page` · `product-cutout` · `illustration` · `dark` ·
`light` · `minimal` · `editorial` · `playful` · `corporate` · `luxury` · `experimental` · `motion` ·
`webgl` (heavy 3D — rebuild the structure, replace the 3D with photos or video).

## Industries

`restaurant-cafe` · `hotel-hospitality` · `food-beverage-brand` · `travel-tourism` · `events` ·
`real-estate` · `architecture-interior` · `construction-industrial` · `energy-green` · `logistics` ·
`automotive` · `health-clinic` · `fitness-wellness` · `beauty-cosmetics` · `fashion-lifestyle` ·
`ecommerce-dtc` · `hardware-product` · `saas-software` · `fintech` · `professional-services` ·
`education` · `nonprofit` · `local-services` · `agency-studio` · `portfolio-personal` · `media-entertainment`

"Luxury" and "creative / experimental" are tags, not industries.

## Feature references (shops only)

A shop needs a second reference: one **live shop in the client's market** with a working checkout.
We copy its pages, flows, fields, rules and common labels — never its look, texts, photos or catalog
(`.cursor/skills/refs/references/feature-inventory.md`). The client's own suggestion comes first.

| Shop | What it shows | Seen |
|---|---|---|
| https://shendetperdite.com | supplements, Kosovo: two-axis variants, cart drawer, cash on delivery, free delivery over a threshold | 2026-09 (supplements-shop tickets) |
| https://fitoresyla.com | Prishtina shop with card payment on the ProCredit hosted page | 2026-09 (supplements-shop tickets) |

Add a row when a project walks a good local shop. Keep the table small: working checkout, local
market, one line on what it proves.

## Add a row (anyone, 5 minutes)

1. Find it: Awwwards category pages (e.g. `awwwards.com/websites/real-estate/`) are the best source —
   they show the site's URL, the award and the date. Also Godly, Land-book, SiteInspire, Lapa Ninja,
   One Page Love, CSS Design Awards.
2. Open the site. Keep it only if it is a real business on its own domain (not `*.webflow.io`,
   `*.netlify.app`, `*.vercel.app`, `*.framer.website`, a concept or a template demo), and a small studio
   could rebuild it in days.
3. Add one line to the industry file. Fill every column. `Checked` = today's date.
4. Branch `refs/<industry>`, PR. No review needed for reference rows.

Rules: one site, one industry. Portals, marketplaces and logged-in apps do not belong here. We store
our notes, never their assets.

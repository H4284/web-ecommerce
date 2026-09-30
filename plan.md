# plan.md — Test Client

| | |
|---|---|
| Status | `Building` |
| Layer | `ecommerce` |
| QA | — |
| Updated | 2026-09-29 |

`[REQUIRED]` blocks the build. `⚠️ CONFIRM WITH CLIENT` = assumed. Status rules: `.cursor/rules/00-core.mdc`.

## Overview

| Field | Value |
|---|---|
| Client · what they do · city | Sanem · creates and produces high-quality perfumes and fragrances · Prishtinë, Kosovo |
| Industry (reference list) | Salons, barbers, skincare, cosmetics (`beauty-cosmetics`) |
| Current website | none |
| The one action a visitor takes | Buy a fragrance and complete checkout |
| Audience (2–3 personas) | A woman in Prishtinë who wants a signature scent for every day · Someone buying a fragrance as a gift · A shop that wants to stock Sanem |
| Language(s) · tone (3 adjectives) | Albanian + English · Albanian default · sensory, calm, precise |
| The characteristic thing this design must express | Quiet luxury in a bottle |

## Conversion

| Channel | On? | Value |
|---|---|---|
| Phone | off | — |
| WhatsApp | on | +383 49 625 317 |
| Email | off | — |
| Form | off | — |
| Booking / visit | off | — |

Primary CTA label: WhatsApp

## Sitemap (`landing` = one row)

| Page | Route | Status live / hidden / deferred | Visitor action | Copy owner |
|---|---|---|---|---|
| Home | `/` | live | Browse the collection | Thrio drafts · client approves |
| About | `/rreth-nesh` | live | Learn the brand | Thrio drafts · client approves |
| Collection | `/koleksioni` | live | Open a product | Thrio drafts · client approves |
| Product details | `/koleksioni/[slug]` | live | Add to cart | Thrio drafts · client approves |
| Cart | `/shporta` | live | Go to checkout | Thrio drafts · client approves |
| Checkout | `/checkout` | live | Place the order | Thrio drafts · client approves |
| Contact | `/kontakt` | live | Open WhatsApp | Thrio drafts · client approves |
| FAQ | `/pyetje-te-shpeshta` | live | Find an answer | Thrio drafts · client approves |
| Shipping | `/dergesa` | live | Read delivery policy | Thrio drafts · client approves |
| Returns | `/kthime` | live | Read returns policy | Thrio drafts · client approves |
| Privacy | `/privatesia` | live | Read the policy | Thrio |
| Terms | `/kushtet` | live | Read the policy | Thrio |
| Client dashboard | `/admin` | live | Manage the shop | — |
| 404 | — | live | Back to home | Thrio |

## Brand

Logo (SVG in `brief/brand/`): none yet · colors / fonts: none — set after `/refs` ·
likes: ⚠️ CONFIRM WITH CLIENT · must **not** look like: ⚠️ CONFIRM WITH CLIENT · section rhythm: Alternating (default)

## Reference (filled by `/refs`)

Reference site: Nymphai Cosmetics · https://nymphaicosmetics.com · screenshots: `brief/refs/nymphai-cosmetics/` · grammar to keep: 50/50 media splits, centred brand moments, product cutout slides, calm type hierarchy

Verified 2026-09-29 from the live page at **1440** and **375**. Screenshot pack re-captured the same day into `brief/refs/nymphai-cosmetics/` (home full + bands 1–5).

| # | Band + archetype | Measurements (side, aspect, split, alignment, captions, mobile) | CTA | Do not invent |
|---|---|---|---|---|
| 1 | hero — split slideshow | Viewport height (~900 / 812). Two full-bleed halves **50/50**; product cutout left, model photo right (slides rotate). Image aspect **0.80** (720×900). Product name label on the right half, mid-height. 1 primary CTA centred on the seam (~y 573). Counter `01 / 03` on mobile. Mobile: single full-bleed stack (no split), swipe pager, CTA in the slide chrome. | 1: primary "Explore" → product | no centred text-only hero; no card frame; no dual stacked CTAs; no inset media |
| 2 | brand — floating collage | Tall band (~2250 desktop / ~2030 mobile). Brand name centred as h2 (~446px wide). ~10 small floating photo tiles (~144px wide, mixed aspect) around the title. 1 CTA centred below. Mobile: same centred title + floating tiles (11 visible), CTA centred. | 1: "Discover the line" → collection | no grid of equal cards; no left-aligned title block; no dense product grid here |
| 3 | story — editorial manifesto | Tall/short. Centred h2 full content width (~1297). Body copy left-aligned in a centred column (~900px / ~62% width). Oversized decorative letters behind/below (aria-hidden). No media. Mobile: stacked centred headline + body, no side media. | none | no image split; no CTA; no cards; no icon row |
| 4 | products — horizontal sticky slides | Sticky viewport slides (3 products). Text column **left ~31%** (448px), media **right ~69%**. Eyebrow + product name + price + short blurb left-aligned. Product bottle cutout centre-right (~533×765) + tall overlay strip (~300×900). Counter `01 / 03` top-right. Desktop: horizontal scroll/snap between slides. Mobile: stacked slides (~1624 total), info column ~288px, same left text / right cutout grammar per slide. | 1 per slide: "Explore" → PDP | no multi-column product grid; no add-to-cart on home; no 2 CTAs per slide |
| 5 | trust — accordion pillars | Viewport-tall. Three claims (title + paragraph), one open at a time; large heading. No product photos. Mobile: same stacked accordion. | none (expand controls only) | no icon grid; no stats strip; no CTA |

Key pages: home only for layout reference; shop flows come from the Feature reference.

Asset brief: icons Lucide · photos client product + lifestyle (perfume bottles, texture, place) · cutouts transparent bottle PNGs for the product slides · illustrations none · motion moments hero slide crossfade · collage float · product slide snap · trust expand

### Direction (proposal)

1. Layout follows the Nymphai blueprint band order and measurements.
2. Colors and type are Sanem's (set in `/design`), not Nymphai's.
3. Keep the 50/50 hero split, floating collage, manifesto type, and cutout product slides.
4. Swap Italian cosmetics copy and donkey-milk story for Sanem fragrance stories.
5. Signature moment: full-bleed split hero with one centred Explore into the first scent.

## Copy lock

| Key | Locked copy |
|---|---|
| `brand.name` | Sanem |
| `nav.primaryCta` | WhatsApp |
| `home.hero.headline` | TBD |
| `home.hero.subline` | TBD |
| `home.hero.cta` | Eksploro |
| `home.brand.cta` | Zbulo linjën |
| `home.story.headline` | Sanem, kapitulli i parë; një erë që qëndron me ty dhe rifloron çdo ditë. |
| `home.products.cta` | Eksploro |
| `contact.form.submit` | — |

## Content checklist (Pending → Received → Approved)

| Asset | Who | Status |
|---|---|---|
| Logo SVG | Client | Pending |
| NAP, hours, social, phone, WhatsApp | Client | Pending |
| Copy per page | Thrio drafts · client approves | Pending |
| Photos | Client | Pending |
| Product list and prices | Client | Pending |
| Privacy page | Thrio | Pending |
| Terms page | Thrio | Pending |
| Shipping and returns page | Thrio drafts · client approves | Pending |

## Ops

Domain (owner, registrar): not owned yet · GitHub repo: Thrio creates under the `thrio` org · Cloudflare account: Thrio owns DNS; client owns the domain after launch ·
Sanity project (cms): — · Firebase projects + staging URL (ecommerce): staging `sanem-ac70d` · prod `sanem-prod` (before ship) · staging URL: TBD after App Hosting · form inbox: — ·
deadline: no fixed date · ClickUp: create under Thrio clients

Handover after launch — domain / Cloudflare / GitHub / Sanity / Firebase owner: Hava · ihthava@gmail.com

## Decisions

| Date | Decision | Why |
|---|---|---|
| 2026-09-29 | Keep Nymphai layout grammar (50/50 hero, collage, manifesto, cutout slides, trust accordion); Sanem colors and type | Reference fidelity · quiet luxury |
| 2026-09-29 | Feature flows from Nicole; look from Nymphai | Layout ≠ market UX |
| 2026-09-29 | No customer accounts; admin auth only | Kickoff · guest checkout |
| 2026-09-29 | `shop:payment-bank` out until Step 0 received | Card off for launch |
| 2026-09-29 | Related products only (no “also bought” until order data) | Feature take · unit 10 |
| 2026-09-29 | PDP “Të ngjashme” uses `relatedIds` then same subcategory; no second carousel | unit 10 · Decision above |

## Out of scope

Pages beyond the Sitemap · languages beyond Overview · a higher layer · migrating an old CMS ·
copywriting and photography unless Copy owner says Thrio · SEO / marketing after launch · paid fonts.

---

## Layer addendum — ecommerce (online shop)

Appended by `/kickoff` when Layer = ecommerce and filled in round 7. Rules: `layer-ecommerce.mdc`.
Confirm this addendum **before** `/scaffold`. Numbers here become the shop's settings.

### Catalog

| Field | Value |
|---|---|
| Products at launch (count) | 8–12 |
| Category tree (top → sub) | Perfumes → Women / Men / Unisex |
| Brands shown as pages | no — one brand only |
| Option axes, max 2 (e.g. flavour × size) | size only — e.g. 50 ml / 100 ml |
| Stock tracked per variant | yes (default) |
| Unit price shown (e.g. € / 100 g) | no |
| Prices include VAT | yes (default) ⚠️ CONFIRM WITH CLIENT |
| Currency · price format | EUR · `22,00 €` (default) |
| Product data source | list + photos from the client |
| Who enters products (launch · after) | Thrio at launch · client after in `/admin` |

### Payments

| Method | On? | Notes |
|---|---|---|
| Cash on delivery (para në dorë) | yes | the courier collects |
| Bank transfer | no | — |
| Card on the bank's hosted page | no for launch | turn on later → Step 0 with the bank |
| Stripe | no | only with an EU or UK company (`docs/adr/0007`) |

**Step 0 — card payment. Only the client can do this. Give them the list at kickoff:**

1. Sign the merchant contract with the bank (a registered business and a live site with terms,
   privacy, returns and contact pages).
2. Receive the merchant id, the keys, and the test and live endpoints.
3. Receive the integration pack (PDF + sample code) and the test cards → `brief/payments/`
   (git-ignored; share it on the team drive). Keys never go into git.
4. Get merchant-portal access for the client (refunds happen there).

Step 0 status: not started (card off for launch)

### Delivery

| Field | Value |
|---|---|
| Countries or zones | Kosovo only |
| Courier | ⚠️ CONFIRM WITH CLIENT |
| Fee per zone | 2,00 € |
| Free delivery over | 50,00 € |
| Delivery time text | 1–3 working days |
| Pickup in store | no |

### Orders

| Field | Value |
|---|---|
| Who processes orders (names, emails) | Hava · ihthava@gmail.com |
| Order notification inbox | ihthava@gmail.com |
| Order number prefix (2–4 letters) | SAN |
| Phone confirmation before shipping | yes (default for cash on delivery) |
| Invoice or fiscal receipt — who issues it | Sanem — test setup ⚠️ CONFIRM WITH CLIENT |
| A cancelled order returns its stock | yes (default) |

### Customers and promotions

| Field | Value |
|---|---|
| Guest checkout | yes (default) |
| Customer accounts · Google sign-in | no · no |
| Discount codes | yes |
| Compare-at price (strikethrough) | yes |
| "New" and "best seller" flags | yes |
| Newsletter sign-up | no |

### Content the client edits in `/admin`

Hero slides · promo blocks · products · orders

### Legal and tracking

| Field | Value |
|---|---|
| Terms, privacy, returns, shipping texts | Thrio drafts · client approves — returns window 14 days ⚠️ CONFIRM WITH CLIENT |
| GA4 measurement id | none for launch |
| Meta Pixel id | none for launch |
| Cookie banner | no (no GA4 or Pixel for launch) |

### Owners and accounts

| Field | Value |
|---|---|
| Production Firebase project | `sanem-prod` in the client's Google account, Blaze + budget alert — owner: ihthava@gmail.com |
| Staging Firebase project | `sanem-ac70d` in Thrio's account |
| Resend sending address | orders@sanem.test |
| Bank merchant portal | the client |

### Feature reference (filled by `/refs`)

Shop: Parfumet Nicole · https://nicoleparfume.com/ · walked on: 2026-09-29 · screenshots: `brief/refs/feature/`

| Page | What it has — elements, rules, exact labels | We take | We skip |
|---|---|---|---|
| Home | Top bar free-delivery promise · nav categories Për Femrat / Për Meshkuj / Unisex / Dyqan / Kontaktoni · cart icon with count · hero + category CTAs **Bli tani** · product grid cards with image, name, "Nga: X,XX €", CTA **Përzgjidhni mundësi** · about teaser · footer: categories, Dorëzimi dhe pagesa, privacy, terms, social, newsletter | Category nav · free-delivery bar · product cards with from-price + select-options CTA · cart count · WhatsApp/contact in chrome | Inspired-by competitor naming · car fragrances category · newsletter 10% offer · perfume finder widget |
| Category | Title (e.g. Parfumet për femrat) · product grid · each card: image, name, from-price, **Përzgjidhni mundësi** (variants on PDP) · filter UI present | Grid of products · from-price · CTA to PDP for variants | Heavy filter widgets · alphabetical brand index |
| Product | Breadcrumb Kreu / category / name · gallery (~3 images) · title · rating · from-price + lowest-30-days note · size axis **Mililitra** (30ml / 50ml / 100ml / refill options) · qty · **Shtoje në shportë** · trust lines (free from 45€, COD) · tabs Përshkrim / Përshtypje · related products | Breadcrumb · gallery · size pills · qty · **Shto në shportë** · price updates with size · short trust/delivery box · related products | Refill bundle SKUs · review tabs if no reviews yet · "inspired by" equivalent codes |
| Cart | Heading **Kosh** / Shporta · line: thumb, name + variant, unit price, qty stepper, remove · subtotal · shipping line **Poshta: 2,20 €** · free-ship progress ("Shtoni të paktën X €…") · coupon field · CTA **Shkoni në arkë** | Line items + qty + remove · coupon · shipping fee · free-delivery progress · **Vazhdo te pagesa** / arkë | Cart drawer-only (use full `/shporta` page) |
| Checkout | Guest fields: E-mail*, Emri*, Mbiemri*, company optional, Vend/Rajon* (Kosovë), Rruga*, Qytet*, Kod postar*, Telefon* · optional create account · ship-to-other · order notes · order summary · coupon · payment **Para në dorëzim** only · terms checkbox · CTA **Bëje porosinë** · free-ship progress · fee **2,20 €** under 45€ | Guest checkout · same required fields · COD label **Para në dorë** · terms checkbox · order summary · stop before submit | Create-account checkbox · newsletter opt-in · Albania zone · place-order click (never automate) |
| Account | Login: email + password · Register · Lost password | Skip for launch (plan: no customer accounts) | Full account area |
| Shipping / returns | Page **Dorëzimi dhe pagesa**: COD via courier · Kosovo fee **2,2 €** under **45 €**, free at/above · Albania **5,2 €** · time **2–3 ditë pune** · phone confirm implied by COD | Kosovo fee + free threshold + delivery days text · COD explanation | Albania shipping · multi-country footer contacts |

### Shop build order (filled by `/design`)

Two tracks after `shop:rules-tests` + shell: **A** storefront → cart → checkout · **B** admin auth → admin.

| # | Unit | Needs | In? | Owner | ClickUp | Status |
|---|---|---|---|---|---|---|
| 1 | `shop:catalog-model` | `/scaffold` | yes | | | done |
| 2 | `shop:catalog-seed` | 1 | yes | | | done |
| 3 | `shop:catalog-data` | 2 | yes | | | done |
| 4 | `shop:settings` | 2 | yes | | | done |
| 5 | `shop:rules-tests` | 3, 4 | yes | | | done |
| — | `shell` | 3 | yes | | | done |
| 6 | `shop:product-card` | 3, shell | yes | | | done |
| — | `home:band-1` … `home:band-5` | 6 | yes | | | band-1–5 done |
| 7 | `shop:category-page` | 6 | yes | | | done |
| 8 | `shop:brand-page` | 7 | no | | | one brand only |
| 9 | `shop:product-page` | 4, 6 | yes | | | done |
| 10 | `shop:product-extras` | 9 | yes | | | done · related only |
| 11 | `shop:search` | 3, shell | yes | | | done |
| 12 | `shop:legal-pages` | shell | yes | | | done |
| 13 | `shop:cart-store` | 1 | yes | | | done |
| 14 | `shop:cart-validate` | 3, 4, 13 | yes | | | done |
| 15 | `shop:cart-drawer` | 9, 14 | yes | | | done |
| 16 | `shop:checkout-form` | 15 | yes | | | done |
| 17 | `shop:order-create` | 16 | yes | | | done |
| 18 | `shop:order-emails` | 17 | yes | | | done |
| 19 | `shop:thank-you` | 17 | yes | | | done |
| 20 | `shop:payment-bank` | 17 + Step 0 | no | | | Step 0 not started |
| 21 | `shop:auth` | shell | yes | | | done |
| 22 | `shop:account-orders` | 17, 21 | no | | | no customer accounts |
| 23 | `shop:account-profile` | 13, 17, 21 | no | | | no customer accounts |
| 24 | `shop:admin-shell` | 21 | yes | | | done |
| 25 | `shop:admin-products` | 3, 24 | yes | | | done |
| 26 | `shop:admin-images` | 25 | yes | | | done |
| 27 | `shop:admin-taxonomy` | 24 | yes | | | done |
| 28 | `shop:admin-orders` | 18, 24 | yes | | | done |
| 29 | `shop:admin-discounts` | 14, 24 | yes | | | done |
| 30 | `shop:admin-content` | 24, 26 | yes | | | done |
| 31 | `shop:admin-dashboard` | 28 | yes | | | done |
| 32 | `shop:analytics` | 19 | no | | | no GA4 / Pixel |
| 33 | `shop:seo` | 9 | yes | | | done |
| 34 | `shop:hardening` | 17 | yes | | | done |
| 35 | `shop:e2e` | 28 | yes | | | done |
| 36 | `shop:backups` | production | yes | | | |
| 37 | `shop:import` | 26 | no | | | list + photos, not spreadsheet |

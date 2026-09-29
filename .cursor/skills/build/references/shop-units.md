# Shop units — the online shop, split into prompts

The `ecommerce` layer as small units. One unit = one branch = one PR, ½ to 2 days. Each unit has a
**Prompt** and a **Done when** list — the same shape as the first shop's ClickUp tickets, cut smaller
(`docs/notes/2026-09-28-supplements-shop-review.md`).

## How to use this file

1. `/design` copies the index below into `plan.md` → Shop build order. Units the plan does not need
   get `In? no`.
2. The Producer creates one ClickUp task per unit: title `shop:<id> — <title>`, description = the
   unit's Prompt and Done when, plus the plan values it uses (fees, labels, prefixes).
3. The developer types `/build shop:<id>`. The agent reads this unit, the shop addendum in
   `plan.md`, `layer-ecommerce.mdc` and `code-firebase.mdc`, and builds this unit only.
4. Every unit ends green: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. A new Firestore
   collection joins the rules test list (`pnpm test:rules`). Tests that need data go to
   `tests/emulator/` and must pass `pnpm test:emulator` before the PR. UI units add screenshots at
   **375 and 1440**. All labels use the plan's language.

Size: **S** ≤ ½ day · **M** ≈ 1 day · **L** ≈ 2 days (split into two PRs if it passes ~400 changed lines).
Two tracks after unit 5 and the shell: **A** storefront → cart → checkout (6–20) and **B** sign-in →
admin (21, 24–27). Units 22, 23, 28 and 29 wait for track A (units 13, 14, 17, 18).

## Index

| # | Unit | Needs | Size | From epic |
|---|---|---|---|---|
| 1 | `shop:catalog-model` | `/scaffold` | S | 2 |
| 2 | `shop:catalog-seed` | 1 | M | 2 |
| 3 | `shop:catalog-data` | 2 | M | 2 |
| 4 | `shop:settings` | 2 | S | 5 |
| 5 | `shop:rules-tests` | 3, 4 | S | 2 |
| — | `shell` (standard unit) | 3 | M | 1 |
| 6 | `shop:product-card` | 3, shell | S | 3 |
| — | `home:band-1 … N` (standard units) | 6 | M each | 3 |
| 7 | `shop:category-page` | 6 | M | 3 |
| 8 | `shop:brand-page` | 7 | S | 3 |
| 9 | `shop:product-page` | 4, 6 | L | 3 |
| 10 | `shop:product-extras` | 9 | S | 3 |
| 11 | `shop:search` | 3, shell | M | 3 |
| 12 | `shop:legal-pages` | shell | S | 3 |
| 13 | `shop:cart-store` | 1 | S | 4 |
| 14 | `shop:cart-validate` | 3, 4, 13 | M | 4 |
| 15 | `shop:cart-drawer` | 9, 14 | M | 4 |
| 16 | `shop:checkout-form` | 15 | M | 5 |
| 17 | `shop:order-create` | 16 | L | 5 |
| 18 | `shop:order-emails` | 17 | S | 5 |
| 19 | `shop:thank-you` | 17 | S | 5 |
| 20 | `shop:payment-bank` | 17 + Step 0 received | L | 5.1 |
| 21 | `shop:auth` | shell | M | 6 |
| 22 | `shop:account-orders` | 17, 21 | S | 6 |
| 23 | `shop:account-profile` | 13, 17, 21 | M | 6 |
| 24 | `shop:admin-shell` | 21 | S | 7 |
| 25 | `shop:admin-products` | 3, 24 | L | 7 |
| 26 | `shop:admin-images` | 25 | M | 7 |
| 27 | `shop:admin-taxonomy` | 24 | S | 7 |
| 28 | `shop:admin-orders` | 18, 24 | M | 7 |
| 29 | `shop:admin-discounts` | 14, 24 | S | 7 |
| 30 | `shop:admin-content` | 24, 26 | M | 7 |
| 31 | `shop:admin-dashboard` | 28 | S | 7 |
| 32 | `shop:analytics` | 19 | S | 8 |
| 33 | `shop:seo` | 9 | S | 8 |
| 34 | `shop:hardening` | 17 | S | 8 |
| 35 | `shop:e2e` | 28 | M | 8 |
| 36 | `shop:backups` | production project | S | 8 |
| 37 | `shop:import` (only if the products come as a spreadsheet) | 26 | M | 8 |

Then `/qa` (with `.cursor/skills/qa/references/shop-checks.md`) and `/ship`.

---

## Stage 1 — Catalog

### 1 · `shop:catalog-model` — types and schemas

**Prompt**
1. `lib/shop/schemas.ts`: zod schemas and types for `Category` (name, slug, parentId or null, order,
   isActive, image, seo), `Brand` (name, slug, logo, isActive, seo), `Product` (name, slug, brandId,
   categoryIds, shortDescription, description as markdown, images `[{ path, alt }]`, options
   `[{ name, values }]` with **max 2 axes**, status `draft | active | archived`, isNew, isBestSeller,
   unit `{ amount, label }` for the unit price, relatedIds, searchTokens, minPriceCents, maxPriceCents,
   totalStock, defaultVariantId, createdAt, updatedAt) and `Variant` (sku, optionValues, priceCents,
   compareAtCents, stock, isDefault, image).
2. `lib/shop/slug.ts`: lowercase, `a-z 0-9 -` only, Albanian letters mapped (ë → e, ç → c).
3. `lib/shop/money.ts`: `formatCents`, `unitPrice(priceCents, unit)`. Integer maths only.
4. `lib/shop/search.ts`: `searchTokens(name, brand)` → lowercase prefixes of every word, 2–15
   characters, diacritics removed.
5. `tests/unit/`: 5 invalid documents rejected, 3 valid accepted, slug and token tests.

No Firestore code. No UI.

**Done when**
- [ ] The 5 invalid examples fail with readable messages; the 3 valid ones pass.
- [ ] `slugify("Kreatinë & Performancë")` returns `kreatine-performance`.
- [ ] `formatCents(2200)` returns the plan's format (default `22,00 €`).

### 2 · `shop:catalog-seed` — seed data shaped like the client's catalog

**Prompt**
1. `scripts/seed.ts` writes to the **emulator only**. Stop with an error if `FIRESTORE_EMULATOR_HOST` is empty.
2. Data comes from `plan.md` → Catalog: the client's category tree, the brands (if on), and 20
   invented products. At least 5 have both option axes and 4+ variants. Some are out of stock, some
   have a compare-at price, some are new or best sellers.
3. Collections: `categories`, `brands`, `products`, `products/{id}/variants`. Parse every document
   with the unit-1 schemas before you write it.
4. `lib/shop/catalog-write.ts`: `recomputeProduct(productId)` sets minPriceCents, maxPriceCents,
   totalStock, defaultVariantId and searchTokens. The seed uses it; the admin reuses it later.
5. Placeholder images: sharp makes plain colour images at **320, 640, 960, 1280** px →
   Storage emulator `products/<id>/<n>-<width>.webp`.
6. Fixed ids: running the seed twice gives the same data.

Never use the feature reference's catalog, texts or photos.

**Done when**
- [ ] `pnpm seed` twice → the same counts: the plan's categories, 20 products, 5+ with 2 axes.
- [ ] Three products checked by hand in the Emulator UI: the denormalised fields are right.
- [ ] Placeholder images load from the Storage emulator at all four widths.

### 3 · `shop:catalog-data` — server data layer

**Prompt**
1. `lib/shop/catalog.ts` (server only): `getCategoryTree()`, `getCategoryBySlug()`,
   `getBrandBySlug()`, `getProductBySlug()` with variants, `listProducts({ categoryId | brandId, page,
   pageSize, sort })` with sort newest / price up / price down / best sellers, `searchProducts(q, limit)`,
   `getRelated(product)`, `getBestSellers(n)`, `getNewProducts(n)`, `getOffers(n)`.
2. Only active products, categories and brands. A category lists its own products and its children's
   (`array-contains-any`, max 30 ids).
3. Parse every document with the schemas. A bad document is logged and skipped, never a crash.
4. Add every composite index the queries need to `firestore.indexes.json`.
5. `scripts/verify-catalog.ts` calls every query against the emulator and prints the counts.
6. Split as `code-firebase.mdc` says: the uncached queries live in `lib/shop/catalog-queries.ts`;
   `lib/shop/catalog.ts` wraps them in `unstable_cache` (`revalidate: 300`, tag `catalog`) and
   returns plain JSON (dates as ISO strings). Scripts, tests, the cart check and the order route call
   the uncached queries.

No UI.

**Done when**
- [ ] `pnpm run:local scripts/verify-catalog.ts` prints results for every query.
- [ ] A search for "kreat" finds "Kreatinë"; an archived product never appears anywhere.
- [ ] No missing-index error in the emulator log.

### 4 · `shop:settings` — shop settings document

**Prompt**
1. `settings/shop` with a zod schema: deliveryMethods `[{ id, label, priceCents, freeOverCents, days,
   active }]`, paymentMethods `[{ id: "cod" | "transfer" | "bank-card", label, description, active,
   order }]`, orderPrefix, ordersInbox, company `{ name, email, phone, address, iban }`.
2. Values from `plan.md` → Delivery, Payments, Orders. The seed writes them.
3. `lib/shop/settings-queries.ts`: the uncached read. `lib/shop/settings.ts`: `getShopSettings()`
   for pages, cached with `unstable_cache` (tag `settings`, 5 minutes). The order route reads
   `settings/shop` inside its transaction instead.
4. No fee, threshold or label as a constant in code — only from settings.

**Done when**
- [ ] The seed writes the plan's values; `getShopSettings()` returns them.
- [ ] Unit test: free delivery applies at exactly the threshold (≥), not one cent below.

### 5 · `shop:rules-tests` — prove the rules

**Prompt**
1. Extend the scaffold's `tests/rules/firestore.test.ts` (`@firebase/rules-unit-testing`, project
   `demo-<slug>`): for `categories`, `brands`, `products`, `products/*/variants`, `settings`, an
   anonymous and a signed-in client can neither read nor write.
2. `tests/rules/storage.test.ts`: anyone can get `products/…` and `content/…`; nobody can list or
   write; other paths are closed.
3. `pnpm test:rules` runs both in CI (recipe step 7).

**Done when**
- [ ] `pnpm test:rules` is green locally and in CI.
- [ ] Changing `firestore.rules` to allow reads makes the test fail (try it once, then revert).

---

## Stage 2 — Storefront (track A)

Build `shell` first (it needs unit 3): header with logo, category menu (mega-menu on desktop, drawer
on mobile), search button (⌘K), account link, cart button with a count (0 for now), footer, cookie
banner when GA4 or the Pixel is on, skip link, and the branded `app/(site)/not-found.tsx`.
Categories come from `getCategoryTree()`.

### 6 · `shop:product-card` — card, price, stock badge

**Prompt**
1. `components/shop/price.tsx`: the price, the compare-at price struck through (only when it is
   higher), the unit price line ("0,06 €/g") when the product has a unit.
2. `components/shop/stock-badge.tsx`: in stock / out of stock, labels from the plan.
3. `components/shop/product-card.tsx`: image (second image on hover, desktop only), brand, name,
   variant label, Price, StockBadge. The whole card is one link to `/products/<slug>`.
4. `components/shop/product-grid.tsx` and `product-carousel.tsx` (shadcn Carousel, arrows and swipe).
   Columns and the mobile peek come from the design-reference row.
5. `app/dev/cards/page.tsx` shows 8 seeded products. It returns `notFound()` in production.

**Done when**
- [ ] Screenshots of `/dev/cards` at 375 and 1440 match `DESIGN.md`.
- [ ] An out-of-stock card shows the badge; a card without compare-at shows no struck price.
- [ ] The network tab shows the 320 or 640 WebP files, not the 1280 ones, at 375.

### `home:band-N` — home bands (standard units)

Build each band with `/build home:band-N` from the blueprint. Feature bands (category tiles, offers,
best sellers, new products, brand strip, newsletter, free-delivery banner) read `lib/shop/catalog.ts`
and `content/home.ts`; `shop:admin-content` moves the editable blocks to Firestore later. The
newsletter band posts to `/api/newsletter`: honeypot first → Turnstile → zod → `newsletter/{emailHash}`.

### 7 · `shop:category-page` — category listing

**Prompt**
1. `app/(site)/categories/[slug]/page.tsx`: breadcrumb, title, subcategory chips, sort select,
   product grid, pagination with `?page=`, empty state.
2. No `generateStaticParams` — the storefront layout is `force-dynamic` (`code-firebase.mdc`).
   Unknown or inactive slug → `notFound()`.
3. `generateMetadata`: "<Category> | <Shop>", description, canonical. JSON-LD `BreadcrumbList`.
4. `loading.tsx` with a grid skeleton.

**Done when**
- [ ] Chips and pagination work; page 2 opens at the top; an unknown slug shows the 404.
- [ ] Screenshots at 375 and 1440 match the blueprint row for listing pages.

### 8 · `shop:brand-page` — brand listing

**Prompt**
1. `app/(site)/brands/[slug]/page.tsx` reuses the listing from unit 7, filtered by brand, with the
   brand logo and description. `app/(site)/brands/page.tsx` lists active brands.
2. Metadata and breadcrumb as in unit 7.

**Done when**
- [ ] A brand page shows only that brand's active products; an unknown slug shows the 404.

### 9 · `shop:product-page` — product page and variant selector

**Prompt**
1. `app/(site)/products/[slug]/page.tsx`: breadcrumb (home / top category / subcategory / product),
   gallery with thumbnails (swipe on mobile), brand, name, short description, Price, StockBadge,
   variant selector, quantity, add-to-cart button, delivery box (fee, free-delivery threshold,
   delivery time from settings), description (`react-markdown`, no raw HTML), categories.
2. `components/shop/variant-selector.tsx`: one pill group per axis. A pill is disabled when no
   variant has that value with the other selected values. A change updates price, compare-at,
   stock, unit price and image, sets `?variant=<sku>` with `window.history.replaceState` (no server
   round trip), and sets the title "<Product> - <Value> / <Value> | <Shop>".
3. The server reads `searchParams.variant` (await it) and renders that variant on first load.
4. `generateMetadata` + OG image (first image, 1280) + JSON-LD `Product` with one `Offer` per
   variant (price, `EUR`, availability, sku) + `BreadcrumbList`.
5. The add-to-cart button stays disabled with a "coming soon" note until unit 15.

**Done when**
- [ ] A variant change updates price, stock, unit price, title and URL; a reload keeps the variant.
- [ ] Impossible combinations are disabled and cannot be clicked.
- [ ] The JSON-LD passes the schema.org validator; screenshots at 375 and 1440.

### 10 · `shop:product-extras` — related products

**Prompt**
1. "Similar products": `relatedIds` first, then the same subcategory, never the product itself, max 8.
2. "Customers also bought" only if the feature inventory takes it. Until real order data exists, it
   shows best sellers of the same top category. Write this in `plan.md` → Decisions.

**Done when**
- [ ] Both carousels render, never show the current product, and hide when empty.

### 11 · `shop:search` — search dialog and page

**Prompt**
1. `app/api/search/route.ts`: `GET ?q=` (2–50 characters) → `searchProducts` → top 8 with image,
   brand, name, price. Short cache headers.
2. `components/shop/search-dialog.tsx` (shadcn Command): ⌘K / Ctrl+K opens, Esc closes, 250 ms
   debounce, Enter opens `/search?q=`.
3. `app/(site)/search/page.tsx`: the full result grid, an empty state with category links, `noindex`.

**Done when**
- [ ] "kreat" shows creatine products in under 1 s locally; Enter shows the same results on the page.
- [ ] The dialog works with the keyboard only.

### 12 · `shop:legal-pages` — about, delivery, returns, privacy, terms

**Prompt**
1. `content/pages/<slug>.md` holds the client's approved text (Content checklist). Missing text → a
   clearly labelled placeholder. Never write legal text yourself.
2. `app/(site)/(legal)/[page]/page.tsx` renders the markdown in a prose layout, with metadata.
3. Footer links to all five pages.

**Done when**
- [ ] Five pages render with the right titles; every placeholder is labelled as a placeholder.

---

## Stage 3 — Cart (track A)

### 13 · `shop:cart-store` — cart state

**Prompt**
1. `stores/cart.ts`: zustand with `persist` (key `cart_v1`). A line: variantId, productId, sku, name,
   variantLabel, imagePath, priceCents, compareAtCents, qty, maxQty. Plus `discountCode`.
2. Actions: `add` (same variant → qty + 1), `setQty` (1 … maxQty), `remove`, `restore` (undo),
   `clear`, `applyServerLines(lines)`.
3. Selectors: `itemCount`, `subtotalCents`, `freeDeliveryRemainingCents(thresholdCents)`.
4. `tests/unit/cart.test.ts` for every action and selector.

**Done when**
- [ ] The same variant twice → one line with qty 2; two variants of one product → two lines.
- [ ] All cart tests are green. No floats anywhere.

### 14 · `shop:cart-validate` — server cart check and discount codes

**Prompt**
1. `POST /api/cart/validate`: body `{ lines: [{ variantId, productId, qty }], discountCode }`.
   `lib/shop/cart-schema.ts` (zod, shared with unit 17): `qty` is an integer from 1 to 99, at most
   50 lines. Merge lines with the same `variantId` first. Re-read every product and variant straight
   from Firestore (no cache). Return the corrected lines, messages, subtotal, discount and the
   delivery options. Clamp qty to stock. Drop archived products with a message.
2. `discounts/{CODE}`: type `percent | fixed | free_delivery`, value, minSubtotalCents, startsAt,
   endsAt, usageLimit, usedCount, active. `lib/shop/discounts.ts` validates and computes, with
   messages in the plan's language: invalid, expired, minimum not reached, limit reached.
3. The cart calls this route when the drawer opens, after a qty change (debounced) and before checkout.
4. Tests: percent rounds to whole cents, fixed never goes below 0, free delivery, expiry, minimum, limit.
5. Add `discounts` to the rules test list.

**Done when**
- [ ] A price changed in the emulator shows in the cart the next time it opens.
- [ ] A qty above stock is clamped with a message; the four discount messages appear in the right cases.
- [ ] `qty` −1, 0 or 0.5 → 400; the same variant twice → one merged line.

### 15 · `shop:cart-drawer` — drawer and cart page

**Prompt**
1. Wire add-to-cart on the product page (and quick-add on cards if `DESIGN.md` has it): loading
   state, toast, then the drawer opens.
2. `components/shop/cart-drawer.tsx` (shadcn Sheet, right side, full width at 375): lines with
   image, name, variant label, qty stepper (− / + / input), remove with a 5-second undo, prices,
   discount input, free-delivery progress ("Add 28,00 € for free delivery" → the success text),
   subtotal, "delivery at checkout", checkout button, continue-shopping link, empty state.
3. The header cart count updates; a short animation respects reduced motion.
4. `app/(site)/cart/page.tsx`: the same content, wider.

**Done when**
- [ ] The count, the clamp, the undo and the reload all work; the progress text has 2 decimals and
      switches exactly at the threshold.
- [ ] Usable with a thumb at 375; screenshots at 375 and 1440.

---

## Stage 4 — Checkout and orders (track A)

### 16 · `shop:checkout-form` — the checkout page

**Prompt**
1. `app/(site)/checkout/page.tsx`. Empty cart → redirect to `/cart` with a message.
2. react-hook-form + a zod schema shared with the server (`lib/shop/checkout-schema.ts`): email;
   delivery address — country (default Kosovo), city (searchable, all municipalities from
   `lib/shop/cities.ts`), recipient, address, postal code (optional), phone (`+383` and 8 digits
   for Kosovo); "billing = delivery" (on by default, a second required form when off); delivery
   and payment methods from settings (cash on delivery selected); newsletter opt-in (off);
   "create an account" only if accounts are on.
3. Order summary (sticky on desktop): lines, subtotal, discount, delivery, total — all from `/api/cart/validate`.
4. Draft kept in `sessionStorage`; a honeypot field; the Turnstile widget.
5. The submit handler comes in unit 17.

**Done when**
- [ ] Errors in the plan's language; the phone accepts "+383 49 123 456" and rejects "049123456".
- [ ] Typing "Pri" finds Prishtinë; the delivery fee and the free threshold update the total live.

### 17 · `shop:order-create` — the order route, one transaction

**Prompt**
1. `POST /api/orders`: honeypot first (return the normal success shape at once) → Turnstile →
   zod (`lib/shop/checkout-schema.ts` + `cart-schema.ts`: qty 1–99, max 50 lines, same variants
   merged) → **one Firestore transaction**:
   - read the settings, every product and variant, the discount, `counters/orders`;
   - check status and stock per variant (summed qty) → 409 with the SKU and the available qty;
   - compute lines, subtotal, discount, delivery and total in cents on the server;
   - write each variant and product once (stock − qty, totalStock − qty), discount usedCount + 1,
     counter + 1, and `orders/{id}`: number `<PREFIX>-<YYYY>-<00042>`, status `pending`,
     paymentStatus `cod_due` (cash) or `awaiting_payment` (transfer), `stockTaken: true`, customer
     (with `uid` when the session cookie is valid), addresses, line snapshots, totals, methods,
     newsletterOptIn, createdAt, timeline.
2. `lib/shop/order-link.ts`: HMAC-SHA256 of the order id with `ORDER_LINK_SECRET`. Return
   `{ orderId, number, thankYouUrl: "/orders/<id>/thank-you?t=<token>" }`.
3. The client: 200 → clear the cart, open the thank-you URL. 409 → update the cart with the
   server's message. Any other error → keep the cart and show a retry message. After any response
   that is not 200, reset the Turnstile widget (a token works once).
4. `tests/emulator/orders.test.ts`: two parallel orders for the last unit → exactly one 200 and one
   409; a body with lower prices still stores the server total; the same variant in two lines
   cannot sell more than the stock.
5. Add `orders` and `counters` to the rules test list.

**Done when**
- [ ] An order appears with the next number; each variant's stock drops by its qty, never below 0.
- [ ] The race, price-tamper and duplicate-line tests are green; the cart clears only on success.

### 18 · `shop:order-emails` — confirmation and admin emails

**Prompt**
1. `emails/order-confirmation.tsx` and `emails/order-admin.tsx` (react-email), in the plan's
   language: number, lines, totals, delivery address, payment text ("pay the courier in cash"; for
   transfer: the IBAN, the amount and the order number as the payment reference), shop contact.
2. `lib/shop/email.ts` sends with Resend after the transaction commits, then sets
   `emails.confirmationAt` / `emails.adminAt`. An email that is already marked is never sent again.
3. `emails/order-status.tsx` for status changes (used by unit 28).
4. No `RESEND_API_KEY` locally → log the rendered HTML instead of sending.

**Done when**
- [ ] One order → one customer email and one admin email; a second send call sends nothing.
- [ ] The email reads well at 375 in the Resend preview or the logged HTML.

### 19 · `shop:thank-you` — thank-you page

**Prompt**
1. `app/(site)/orders/[id]/thank-you/page.tsx` checks the token from unit 17's `order-link.ts`:
   missing, a different length, or a wrong value → `notFound()` (check the length before
   `timingSafeEqual`, which throws on different lengths).
2. Show the number, lines, totals, the payment text (transfer: IBAN and reference), "we will call you
   to confirm", shop contact. `noindex`.
3. Call `track("purchase", …)` once per order (a `sessionStorage` flag). It is a no-op until unit 32.

**Done when**
- [ ] The right token shows the order; a changed token shows the 404; a reload does not repeat `purchase`.

### 20 · `shop:payment-bank` — card payment on the bank's hosted page

**Blocked until Step 0 is `received`** (`plan.md` → Payments). Rules 9–11 of `layer-ecommerce.mdc` apply.

**Prompt**
1. Read the bank's integration pack in `brief/payments/` first. Field names, the signature
   algorithm, endpoints, amount units and test cards come **only** from it.
2. Payment method `bank-card` in settings (label from the plan), on/off in the admin. Secrets
   `BANK_MERCHANT_ID`, `BANK_SECRET_KEY`, `BANK_ENDPOINT` as App Hosting secrets.
3. `/api/orders` with `bank-card`: status `pending`, paymentStatus `awaiting_payment`,
   `stockTaken: false`, **no stock change**. Write `reservations/{orderId}` with the lines and
   `expiresAt` = now + 15 minutes. Stock checks subtract active reservations. Expired ones are
   ignored and deleted later — no scheduler. The cart stays in the browser until the payment is `paid`.
4. `lib/payments/bank.ts`: `buildPaymentRequest(order)` and `verifyResponse(body)`, exactly per
   the spec. Unit tests reproduce the example signature from the bank's document byte for byte.
5. `app/(site)/checkout/pay/[orderId]/page.tsx` auto-submits the form to the bank, with a short
   "taking you to the bank's secure page" text.
6. The callback route and the browser return route: signature first → our reference → amount check
   → already `paid` returns 200 → one transaction (stock −, `stockTaken: true`, reservation deleted,
   paymentStatus `paid`, status `confirmed`, bank transaction id, last 4 digits) → then the emails.
   Not enough stock at that moment (the reservation expired and the item sold) → keep `paid`, status
   stays `pending`, timeline note "refund needed", email the orders inbox. Stock never goes below 0.
   Failed or cancelled → `failed`, reservation deleted, the customer back at `/checkout` with the cart intact.
7. The server-to-server callback is the source of truth. The browser return only picks the page and
   clears the cart when the order is `paid`.
8. `docs/payment-runbook.md`: test → live switch, what each status means, what to do with an order
   stuck in `awaiting_payment`.

**Done when**
- [ ] A test card pays: order `paid` + `confirmed`, stock drops once, one email.
- [ ] A declined card: order unpaid, stock unchanged, cart intact, a clear message.
- [ ] The same callback sent twice changes nothing; a changed signature or amount → 400 + audit log.
- [ ] A search of the repo, the logs and Firestore finds no card number, CVV, expiry or secret key.
- [ ] Cash on delivery still works exactly as before.

---

## Stage 5 — Sign-in and customer accounts (track B)

### 21 · `shop:auth` — sign-in and sessions

The admin always needs this unit. Customer registration only when the plan turns accounts on.

**Prompt**
1. `/login` (email + password; Google if the plan says so), `/forgot-password`; `/register` only
   with customer accounts. react-hook-form + zod, labels from the plan. After sign-in go to `?next=`
   (same-site paths only).
2. `POST /api/auth/session`: verify the ID token → `createSessionCookie` → cookie `__session` (14
   days, httpOnly, secure, sameSite `lax`). `POST /api/auth/logout` deletes it.
3. `lib/shop/auth.ts`: the real `getUser()`, `requireUser()` (redirect to `/login?next=`) and
   `requireAdmin()` (claim check).
4. The first sign-in creates `users/{uid}` on the server (email, name, phone, newsletterOptIn, createdAt).
5. Header: "Sign in" when signed out; a menu (account, orders, sign out) when signed in.

**Done when**
- [ ] Wrong password → a clear message; `/account` → `/login?next=/account` → back after sign-in.
- [ ] The session survives a browser restart; sign-out ends it; `users` is in the rules test list.
- [ ] Sign-in also works on the staging URL (after merge), not only locally.

### 22 · `shop:account-orders` — my orders (only with customer accounts)

**Prompt**
1. `app/(site)/account/layout.tsx`, **every** account page and every account data function call
   `requireUser()` (a layout does not re-run on client navigation).
2. `/account` (name, last order), `/account/orders` (number, date, total, status badge),
   `/account/orders/[id]` (detail and timeline). Orders are read on the server where
   `customer.uid == uid` (unit 17 stores it). Another user's order id → `notFound()`.

**Done when**
- [ ] I see only my orders; another id shows the 404; the totals match the email.

### 23 · `shop:account-profile` — addresses, profile, prefill (only with customer accounts)

**Prompt**
1. `/account/addresses` (create, edit, delete, one default) and `/account/profile` (name, phone,
   newsletter, change password). Writes go through server actions with `requireUser()`.
2. Checkout prefill for signed-in users: email, name, phone, default address.
3. Cart merge on sign-in: local lines + `users/{uid}/cart` → merged, no duplicate variants → saved.
   Sign-out keeps the local cart.
4. The checkout "create an account" box creates the user after the order and emails a set-password link.

**Done when**
- [ ] Prefill works; only one default address; the merged cart has no duplicate lines.

---

## Stage 6 — Admin (track B)

### 24 · `shop:admin-shell` — admin layout and guard

**Prompt**
1. `app/admin/layout.tsx` **and every `app/admin/**/page.tsx`** call `requireAdmin()` (a layout
   does not re-run on client navigation). Admin read functions call it too. The layout has a sidebar
   (dashboard, products, categories, brands, orders, discounts, content, settings — labels from the
   plan), the admin's email and sign-out, `noindex`.
2. `lib/shop/admin.ts`: `adminAction(schema, fn)` = `requireAdmin()` → zod → `fn` → an `auditLogs`
   entry (uid, email, action, target, at).
3. `scripts/set-admin.ts <email>`: creates the user if missing, sets `{ admin: true }`, prints a
   set-password link (`generatePasswordResetLink`). Emulator: `pnpm run:local scripts/set-admin.ts <email>`.
   Real project: `pnpm run:remote scripts/set-admin.ts <email> --project <id>` — it calls
   `setRemoteProject()` from `scripts/lib/remote.ts` first (recipe step 5).
4. Tests in `tests/emulator/`: mock `next/headers` so `cookies()` returns a real `__session` cookie
   made with the Auth emulator, and mock `next/cache`. Test both ways for every admin action and
   admin read function: no claim → denied and no audit entry; claim → allowed.

**Done when**
- [ ] A non-admin is sent to `/`; after `set-admin` and a new sign-in the admin sees the dashboard.
- [ ] The step-4 tests pass both ways. Breaking the claim check on purpose makes them fail.

### 25 · `shop:admin-products` — products and variants

**Prompt**
1. A products table (`@tanstack/react-table` via shadcn): search, filter by category, brand and
   status, bulk activate and archive.
2. The form: name, slug (from the name, editable), brand, categories, short description,
   description (markdown with preview), options builder (max 2 axes) → the variant matrix; per
   variant SKU, price, compare-at, stock, default; unit; flags; related products; SEO.
3. Save with `adminAction`: validate → write the product and its variants in one batch →
   `recomputeProduct()` → `updateTag("catalog")`. The batch never writes `stock` of an existing
   variant; a new variant gets its first stock in the same batch.
4. Stock edits run in their own transaction (compare-and-set): read the stock; if it differs from
   the value the form loaded, stop with "Stock changed — reload"; otherwise write it, recompute the
   product, add an audit entry. An order placed while the form is open is never undone.
5. Archive instead of delete. Archived products stay readable in old orders.

**Done when**
- [ ] 2 flavours × 2 sizes → 4 variants; after a save the product page shows the change on reload.
- [ ] Archive hides the product from the storefront and from search; each save writes an audit entry.
- [ ] An order placed while the product form is open: saving the old stock value is refused.

### 26 · `shop:admin-images` — image upload

**Prompt**
1. In the product form: drag and drop, reorder, alt text required. Upload one file per action call
   and check the size in the browser first (the action limit is 11 MB per request).
2. A server action with sharp: EXIF removed, WebP at 320, 640, 960, 1280 (quality 80), inputs up to
   10 MB → Storage `products/<id>/<n>-<width>.webp` with `Cache-Control: public, max-age=31536000,
   immutable`. The product stores `images: [{ path: "products/<id>/<n>", alt }]`.
3. A new upload always gets a new `<n>`. Never overwrite a cached file.

**Done when**
- [ ] Three images, reordered → the storefront gallery follows the new order.
- [ ] A 12 MB file is refused with a message; the network tab shows the right widths.

### 27 · `shop:admin-taxonomy` — categories and brands

**Prompt**
1. Categories: tree with parent, order (up / down buttons), image, SEO, active.
2. Brands: logo, description, active.
3. A category or brand with products cannot be deleted — archive it. Saves call `updateTag("catalog")`.

**Done when**
- [ ] A new order of categories shows in the menu after a reload; deleting a used category is blocked.

### 28 · `shop:admin-orders` — orders

**Prompt**
1. Orders table: number, date, customer, total, status, payment. Filters by status, date and
   payment; search by number, phone or email; CSV export in UTF-8 with a BOM (Excel shows ë and ç).
2. Detail: lines, addresses, totals, payment (bank transaction id and a link to the bank portal for
   refunds), timeline, internal note.
3. Status change with an optional note → timeline entry + the status email (unit 18). `cancelled`
   returns the stock in one transaction, only when `stockTaken` is true, once only.
4. Transfer orders: "Mark as paid" → paymentStatus `paid` + a timeline entry.
5. `app/admin/orders/[id]/print/page.tsx`: printable invoice / packing slip with company details.

**Done when**
- [ ] "Shipped" with a note → the customer gets an email and the timeline shows the note.
- [ ] Cancel twice → the stock comes back once; an unpaid card order returns no stock.
- [ ] The CSV opens in Excel with correct letters.

### 29 · `shop:admin-discounts` — discount codes

**Prompt**
1. List, create, edit and turn off codes. Codes are uppercase and unique. The same validation as
   `lib/shop/discounts.ts`. The used count is read on the server at each page load.

**Done when**
- [ ] A 10 % code with limit 2 works twice and fails the third time; the admin shows 2 uses.

### 30 · `shop:admin-content` — home content and settings

**Prompt**
1. `content/home` in Firestore: hero slides (image, title, subtitle, link, order, active), promo
   blocks, the brand strip order. The home page now reads these from Firestore. Hero images go
   through unit 26's resize helper → `content/home/<n>-<width>.webp`.
2. Settings form: delivery methods, payment methods on/off, free-delivery threshold, company details,
   orders inbox. Newsletter CSV export.
3. Saves call `updateTag("content")` or `updateTag("settings")`.

**Done when**
- [ ] A hero edit shows on `/` after a reload; a 40 € threshold changes the cart and the checkout.
- [ ] A payment method turned off disappears from the checkout.

### 31 · `shop:admin-dashboard` — numbers for the owner

**Prompt**
1. Cards for today, 7 days and 30 days: orders, revenue, average order (cancelled orders excluded).
   Use Firestore aggregation queries (`count`, `sum`).
2. The latest 10 orders; products with low stock (≤ 5 or the plan's number).

**Done when**
- [ ] The numbers match a manual count on the seed data.

---

## Stage 7 — Launch

### 32 · `shop:analytics` — GA4 and Meta Pixel after consent

**Prompt**
1. `lib/analytics.ts`: `track(event, params)`. Scripts load with `next/script` only after cookie
   consent. Ids from `NEXT_PUBLIC_GA_ID` and `NEXT_PUBLIC_META_PIXEL_ID`.
2. GA4 events: view_item_list, view_item, select_item, add_to_cart, remove_from_cart, view_cart,
   begin_checkout, add_shipping_info, add_payment_info, purchase, search, sign_up, login. Meta:
   PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Search. Currency `EUR`.

**Done when**
- [ ] Consent declined → no GA or Meta request; accepted → `page_view` is sent.
- [ ] GA4 DebugView shows the shop events with the right items, values and `EUR`.

### 33 · `shop:seo` — sitemap, robots, structured data

**Prompt**
1. `app/sitemap.ts` from Firestore (`force-dynamic`): active products, categories, brands, the legal pages.
2. `app/robots.ts` disallows `/admin`, `/account`, `/checkout`, `/cart`, `/orders`, `/api`, `/search`.
3. JSON-LD `Organization` and `WebSite` with `SearchAction` on `/`; canonical URLs on every page.
4. A 301 map from the old site's URLs (if any) in `next.config.ts` → `redirects()`.

**Done when**
- [ ] The sitemap lists every active item and nothing private; the Rich Results test passes on staging.

### 34 · `shop:hardening` — headers, abuse, secrets

**Prompt**
1. Headers in `next.config.ts`: HSTS, `X-Content-Type-Options`, `Referrer-Policy`,
   `Permissions-Policy`, and a CSP with `frame-ancestors 'none'`, `base-uri 'self'`,
   `object-src 'none'`, `form-action 'self'` plus the bank's endpoint. No nonce-based CSP — a
   nonce needs `proxy.ts`, which App Hosting does not fully support (ADR 0007).
2. Turnstile on checkout, sign-in, register and newsletter; honeypot first. If abuse appears, add a
   per-IP counter on `/api/orders` — not before.
3. Audit: no secret in any `NEXT_PUBLIC_*` value, no card data anywhere, every collection in the
   rules test list, markdown rendered without raw HTML.

**Done when**
- [ ] securityheaders.com gives the staging URL an A; a search of the client bundle finds no secret.

### 35 · `shop:e2e` — the golden path in CI

**Prompt**
1. Playwright against `pnpm build && pnpm start` with the emulators and the seed: home → category
   → product → choose a variant → add to cart → apply a code → checkout with cash on delivery →
   thank-you page → admin sign-in → the order is listed → the variant's stock dropped.
2. A tamper test: `/api/orders` with lower prices → the stored total is the server total.
3. Extend the seed: an emulator admin user with the claim and one test discount code.
4. A CI job runs both on every PR inside `firebase emulators:exec`: seed → build (with the
   `.env.local` values from the recipe as CI env) → start → Playwright.

**Done when**
- [ ] Green locally and in CI; a deliberate bug in the total makes it fail.

### 36 · `shop:backups` — daily backups (production project)

**Prompt**
1. Google Cloud console → Firestore → Disaster recovery, or:
   `gcloud firestore backups schedules create --database='(default)' --recurrence=daily --retention=4w --project <slug>-prod`.
2. Write the restore steps in `docs/handoff.md`: a restore creates a **new** database; check the
   counts, then switch or copy.
3. Optional: a Cloud Monitoring uptime check on `/` with an email alert.

**Done when**
- [ ] The schedule exists in the production project; the restore steps are in the handoff.

### 37 · `shop:import` — the client's products from a spreadsheet

Only when `plan.md` → Catalog says the product data comes as a spreadsheet.

**Prompt**
1. A CSV template in `brief/` agreed with the client: one row per variant — product slug, name,
   brand, category slugs (separated by `|`), option values, SKU, price, compare-at, stock, image
   file names.
2. `scripts/import-products.ts <file.csv> [--dry-run]` — `pnpm run:remote … --project <id>` for a
   real project; it calls `setRemoteProject()` from `scripts/lib/remote.ts` first. Parse every row
   with the schemas. `--dry-run` prints the errors and the counts and writes nothing.
3. Write products and variants in batches, then `recomputeProduct()` per product. Images come from a
   local folder through the same resize helper as `shop:admin-images`.
4. A second run updates by SKU and never creates duplicates.

**Done when**
- [ ] The dry run on the client's file shows 0 errors (or the client has fixed the rows).
- [ ] The import on staging matches the counts; a second run changes nothing.

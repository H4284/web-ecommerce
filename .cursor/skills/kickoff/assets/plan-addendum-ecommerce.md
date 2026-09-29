
---

## Layer addendum — ecommerce (online shop)

Appended by `/kickoff` when Layer = ecommerce and filled in round 7. Rules: `layer-ecommerce.mdc`.
Confirm this addendum **before** `/scaffold`. Numbers here become the shop's settings.

### Catalog

| Field | Value |
|---|---|
| Products at launch (count) | [REQUIRED] |
| Category tree (top → sub) | [REQUIRED] |
| Brands shown as pages | [yes / no] |
| Option axes, max 2 (e.g. flavour × size) | [REQUIRED: names, or none] |
| Stock tracked per variant | yes (default) |
| Unit price shown (e.g. € / 100 g) | [yes / no] |
| Prices include VAT | yes (default) ⚠️ CONFIRM WITH CLIENT |
| Currency · price format | EUR · `22,00 €` (default) |
| Product data source | [REQUIRED: spreadsheet / old site / list + photos] |
| Who enters products (launch · after) | [REQUIRED] |

### Payments

| Method | On? | Notes |
|---|---|---|
| Cash on delivery (para në dorë) | yes (default) | the courier collects |
| Bank transfer | [yes / no] | IBAN on the thank-you page and in the email |
| Card on the bank's hosted page | [yes / no] | bank: [ProCredit / BKT / other] — Step 0 below |
| Stripe | no | only with an EU or UK company (`docs/adr/0007`) |

**Step 0 — card payment. Only the client can do this. Give them the list at kickoff:**

1. Sign the merchant contract with the bank (a registered business and a live site with terms,
   privacy, returns and contact pages).
2. Receive the merchant id, the keys, and the test and live endpoints.
3. Receive the integration pack (PDF + sample code) and the test cards → `brief/payments/`
   (git-ignored; share it on the team drive). Keys never go into git.
4. Get merchant-portal access for the client (refunds happen there).

Step 0 status: [not started / requested / received]

### Delivery

| Field | Value |
|---|---|
| Countries or zones | Kosovo (default) · [others] |
| Courier | [REQUIRED] |
| Fee per zone | [REQUIRED] |
| Free delivery over | [REQUIRED: amount, or none] |
| Delivery time text | [REQUIRED: e.g. 1–3 working days] |
| Pickup in store | [yes / no] |

### Orders

| Field | Value |
|---|---|
| Who processes orders (names, emails) | [REQUIRED] |
| Order notification inbox | [REQUIRED] |
| Order number prefix (2–4 letters) | [REQUIRED] |
| Phone confirmation before shipping | yes (default for cash on delivery) |
| Invoice or fiscal receipt — who issues it | [REQUIRED] ⚠️ CONFIRM WITH CLIENT |
| A cancelled order returns its stock | yes (default) |

### Customers and promotions

| Field | Value |
|---|---|
| Guest checkout | yes (default) |
| Customer accounts · Google sign-in | [yes / no] · [yes / no] |
| Discount codes | [yes / no] |
| Compare-at price (strikethrough) | [yes / no] |
| "New" and "best seller" flags | [yes / no] |
| Newsletter sign-up | [yes / no] — CSV export from `/admin` (default) |

### Content the client edits in `/admin`

Hero slides · promo blocks · brand strip · [others, or none]

### Legal and tracking

| Field | Value |
|---|---|
| Terms, privacy, returns, shipping texts | [REQUIRED: who writes them] — returns window ⚠️ CONFIRM WITH CLIENT |
| GA4 measurement id | [id / none] |
| Meta Pixel id | [id / none] |
| Cookie banner | yes when GA4 or the Pixel is on |

### Owners and accounts

| Field | Value |
|---|---|
| Production Firebase project | `<slug>-prod` in the client's Google account, Blaze + budget alert — owner: [REQUIRED: email] |
| Staging Firebase project | `<slug>-staging` in Thrio's account |
| Resend sending address | [REQUIRED: e.g. orders@client-domain] |
| Bank merchant portal | the client |

### Feature reference (filled by `/refs`)

Shop: [name + URL] · walked on: [date] · screenshots: `brief/refs/feature/`

| Page | What it has — elements, rules, exact labels | We take | We skip |
|---|---|---|---|
| Home | | | |
| Category | | | |
| Product | | | |
| Cart | | | |
| Checkout | | | |
| Account | | | |

### Shop build order (filled by `/design`)

| # | Unit | Needs | In? | Owner | ClickUp | Status |
|---|---|---|---|---|---|---|
| 1 | `shop:catalog-model` | `/scaffold` | yes | | | |

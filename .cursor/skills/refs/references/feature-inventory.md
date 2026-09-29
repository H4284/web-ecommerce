# Feature reference — walk one live shop, write what customers expect

Shops only. The design reference (from the list) gives the **layout**. The feature reference gives
the **pages, flows, fields, rules and labels** that customers in this market expect. Never its look.

## 1. Pick the shop

1. Ask the client first: "Where else do your customers buy this?" Their answer is the best pick.
2. Otherwise search, for example "<product> dyqan online Kosovë" or "<product> online shop Kosovo".
   Keep a candidate only if it has a working checkout, in the client's country and language.
3. Known examples, seen in September 2026 (`.cursor/brain/references/README.md` → Feature references):
   shendetperdite.com (supplements: variants, cart drawer, cash on delivery, free-delivery threshold)
   · fitoresyla.com (card payment on the ProCredit hosted page).
4. Show 1–3 candidates with one line each. The user picks. Never pick for them.

## 2. Walk it (Playwright MCP, 375 and 1440)

Pages: home · one category · one product with variants · cart with one item · checkout · login or
account · shipping and returns pages · footer.

- **Stop before the final order button.** Never submit an order, never pay, never register.
- Fill forms with fake data only: `Test Test`, `test@example.com`, `+383 44 000 000`.
- Screenshots → `brief/refs/feature/<page>-{375,1440}.png`.

## 3. Write the inventory

One row per page in the addendum's **Feature reference** table (`plan.md`):

- **What it has:** the elements in order, e.g. "breadcrumb · gallery with thumbnails · pills for
  flavour × size · stock badge · unit price €/g · delivery box · add to cart".
- **Rules and numbers:** fees, thresholds, delivery time, required fields, error messages, payment
  methods.
- **Exact labels** that customers expect, in the shop's language ("Shto në shportë", "Para në
  dorë"). Common UI words only — never slogans or product texts.
- **We take / We skip:** decide with the user. Skip what the plan does not need.

## 4. Map it to units

Every "We take" item names the `shop:*` unit that builds it
(`.cursor/skills/build/references/shop-units.md`). An item with no unit → add it to the unit that
owns that page, as one extra "Done when" line. `/design` turns this into the Shop build order.

## Never

Copy the shop's look, photos, product texts, category tree, brand list or prices · place a real
order · keep personal data seen on the site.

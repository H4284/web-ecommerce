# Shop QA checks — `/qa` for Layer `ecommerce`

Run these on top of the normal `/qa` steps. Production build only: the staging URL, or locally
`pnpm build && pnpm start` with the emulators and the seed. Never `next dev`.

## Blocker — money, stock, data, access

1. The golden-path e2e test is green (`pnpm e2e`).
2. Price tamper: `POST /api/orders` with lower prices → the stored total is the server total.
3. Last-unit race: two parallel orders for the last unit → one 200 and one 409.
4. Cancel an order twice → the stock comes back once; an unpaid card order returns no stock; no
   variant ever shows stock below 0.
5. Each email goes out once per event (new order, status change, paid card order).
6. `pnpm test:rules` is green. The browser sends no request to `firestore.googleapis.com`.
7. No secret in the client bundle: search `.next/static` for the secret names and values. No card
   number, CVV or expiry in Firestore, logs or code.
8. A signed-in customer opens `/admin`, `/admin/orders` and calls an admin action → denied every
   time. Sign-in works on the URL under test (cookie `__session`).
9. Another customer's order id (account and thank-you page) → 404.
10. Card payment on: every "Done when" line of `shop:payment-bank` passes again with test cards.

## High — the customer flow

1. Checkout at 375: every field reachable, keyboard works, errors in the plan's language, the phone
   and city rules from the plan.
2. Delivery fee one cent below the free threshold and exactly at it.
3. The four discount messages: invalid, expired, minimum not reached, limit reached.
4. An out-of-stock product cannot go into the cart; impossible variant combinations are disabled.
5. Consent declined → no GA or Meta request.
6. Terms, privacy, returns and delivery pages carry approved text. A placeholder here blocks `/ship`.
7. The order emails read well at 375, and the Resend sending domain is verified (SPF and DKIM).
8. Resend plan fits the order volume (the free plan stops at 100 emails a day, verified 2026-09-28).

## Medium — search engines and speed

1. Product JSON-LD is valid; the sitemap has no private route; `robots.txt` is right.
2. Lighthouse mobile on home, one category, one product: median of 3 after one warm-up request
   (App Hosting can start cold). Targets from `design.mdc`.
3. Product images arrive as pre-sized WebP; no 1280 file at 375.

## Report — add this block

```markdown
### Shop
| check | result |
|---|---|
| golden path e2e | pass / fail |
| price tamper · last-unit race · double cancel | … |
| emails once per event | … |
| rules tests · no browser Firestore calls | … |
| admin guard · other customer's order | … |
| consent gate · legal pages | … |
| card payment (if on) | … |
```

# Shop launch — `/ship` for Layer `ecommerce`

The normal `/ship` gates still apply. These gates and steps replace the Cloudflare deploy steps.

## Extra gates (refuse at the first failure)

1. Production project `<slug>-prod` in the **client's** Google account: Blaze plan, budget alert,
   Firestore + Auth + Storage in `europe-west4`, Thrio has the Owner role.
2. Production backend exists — created as in recipe step 8 with `--project prod`: region
   `europe-west4`, live branch `main`, automatic rollouts **off**, environment name `production`,
   `apphosting.production.yaml` filled. Say **no** if it offers to deploy at once.
3. Every `secret:` name in `apphosting.yaml` exists in the production project's Secret Manager, with
   access granted to the backend. Rules and indexes deployed:
   `pnpm exec firebase deploy --only firestore,storage --project prod`.
4. The real catalog is in production — entered in `/admin` by the client or loaded with
   `shop:import`. No seed data in production.
5. Admin accounts: `pnpm run:remote scripts/set-admin.ts <email> --project <slug>-prod` for each
   person in `plan.md` → Orders; each has set a password and signed in once.
6. Payments: cash on delivery on. Card only if Step 0 is `received`, test cards passed on staging,
   and the live keys are set.
7. Legal pages carry approved text. The Resend sending domain is verified. The orders inbox receives.

## Steps

1. Merge the release PR to `main`. Staging rolls out. Check the golden path on staging once more.
2. Production rollout:
   `pnpm exec firebase apphosting:rollouts:create <backend-id> --git_branch main --project prod`.
3. Domain: add the custom domain in App Hosting. Create its records on Cloudflare as **DNS only**
   and wait for the certificate. For `www`: a proxied placeholder record (`AAAA 100::`) and a
   Cloudflare redirect rule to the apex. Only the App Hosting records stay grey.
4. A real cash-on-delivery test order on production with a Thrio phone number → both emails arrive
   → cancel it in `/admin` → the stock comes back.
5. Card on: one small real payment, then a refund in the bank portal. Both show in the admin.
6. GA4 DebugView and Meta Events Manager show the test events. Search Console gets the sitemap.
   The 301 map from the old site works.
7. `shop:backups` on the production project.
8. Handoff: `docs/handoff.md` (Firebase project and roles, App Hosting backend, env and secret
   **names** and where they live, Resend, domain and DNS notes, bank portal, backups and the restore
   steps, monthly cost and the budget alert) and `docs/admin-guide.md` (screenshots: add a product
   with variants and images, process an order, cancel, discount codes, home content, settings;
   "changes show within 5 minutes").
9. A 30–60 minute admin training with the client's order staff.
10. From now on: merge → check staging → manual production rollout. Production never rolls out
    automatically.

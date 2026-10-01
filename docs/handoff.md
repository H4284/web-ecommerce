# Sanem — ops handoff

Verified 2026-10-01. Fill blank rows at `/ship`. Never put secret **values** in this file — names only.

## Hosting (current)

| | Staging | Production |
|---|---|---|
| Next.js host | **Vercel** preview | **Vercel** production (`main`) |
| Database / Auth / Storage | Supabase project **Sanem** | Same project until a prod Supabase is split |
| Owner | Thrio | Hava · ihthava@gmail.com |
| Supabase URL | `https://rprnkjcyhaqeiacmzmpk.supabase.co` | TBD if a second project is created |

Legacy Firebase App Hosting files (`apphosting*.yaml`) stay in the repo unused. Do not deploy them.

## Env and secrets (names)

Set these in **Vercel → Project → Settings → Environment Variables** (Preview + Production).

### Public

| Name | Notes |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (no trailing slash) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (RLS denies shop tables) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile |
| `NEXT_PUBLIC_GA_ID` | Optional |
| `NEXT_PUBLIC_META_PIXEL_ID` | Optional |
| `NEXT_PUBLIC_USE_EMULATORS` | Leave **unset** on Vercel |

### Secrets (server only)

| Name | Notes |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Service role — never expose to the browser |
| `SUPABASE_DB_PASSWORD` | Database password (order transactions via `pg`) |
| `ORDER_LINK_SECRET` | Thank-you link HMAC |
| `TURNSTILE_SECRET_KEY` | Turnstile verify |
| `RESEND_API_KEY` | Order emails |
| `CONTACT_TO` | Optional forms inbox |

Resend sending address: `orders@sanem.test` (verify the domain before launch).

Local seed: `pnpm seed` (Supabase).

## Domain and DNS

- Cloudflare: Thrio owns DNS until handover.
- Point apex + `www` to Vercel (DNS only / grey cloud if proxied records are not required).

## Bank portal

Card payment is off until Step 0 is received. Portal owner: the client.

## Backups

Use **Supabase** dashboard backups (Pro) or `pg_dump` — not Firebase Firestore schedules.

## Local

```bash
pnpm install
pnpm seed
pnpm dev
```

Admin: `admin@sanem.test` / see `lib/shop/seed-e2e.ts` (local/e2e only).

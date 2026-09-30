# Sanem — ops handoff

Verified 2026-09-30. Fill blank rows at `/ship`. Never put secret **values** in this file — names only.

## Projects and roles

| | Staging | Production |
|---|---|---|
| Firebase project | `sanem-ac70d` (Thrio) | `sanem-prod` (client Google account) |
| Owner | Thrio | Hava · ihthava@gmail.com |
| Region | `europe-west4` | `europe-west4` |
| App Hosting backend | TBD at ship | TBD at ship |
| Live branch | staging branch | `main` (manual rollouts only) |

Thrio needs the **Owner** role on `sanem-prod` before backups, rules deploy, or production rollouts.

## Env and secrets (names)

Public values live in `apphosting.staging.yaml` / `apphosting.production.yaml`.

Secrets live in Secret Manager via App Hosting (`firebase apphosting:secrets:set`):

| Name | Where used |
|---|---|
| `resendApiKey` | `RESEND_API_KEY` |
| `turnstileSecretKey` | `TURNSTILE_SECRET_KEY` |
| `orderLinkSecret` | `ORDER_LINK_SECRET` |

Resend sending address: `orders@sanem.test` (verify the domain before launch).

## Domain and DNS

- Cloudflare: Thrio owns DNS until handover.
- App Hosting custom domain records stay **DNS only** (grey cloud).
- Apex + `www` redirect: see `/ship` shop-launch steps.

## Bank portal

Card payment is off until Step 0 is received. Portal owner: the client.

## Firestore backups (production)

Daily schedule on **`sanem-prod`**, database `(default)`, retention **4 weeks** (`28d`).

### Create the schedule

Unset any emulator host first (`FIRESTORE_EMULATOR_HOST`), then:

```bash
pnpm exec firebase firestore:backups:schedules:create \
  --database '(default)' \
  --recurrence DAILY \
  --retention 28d \
  --project sanem-prod
```

Or with gcloud:

```bash
gcloud firestore backups schedules create \
  --database='(default)' \
  --recurrence=daily \
  --retention=4w \
  --project sanem-prod
```

Helper (same flags): `node scripts/create-backup-schedule.mjs`.

Verify:

```bash
pnpm exec firebase firestore:backups:schedules:list --project sanem-prod
```

Verified 2026-09-30: create/list from this machine as `havajusufi05@gmail.com` returned **403** on `sanem-prod` (no project access). Run the create command after Thrio has Owner, or while logged in as the project owner.

### Restore from a backup

A restore always creates a **new** database. You cannot restore into an existing id (including `(default)` while it still exists).

1. List backups (location is `europe-west4` for this shop):

```bash
pnpm exec firebase firestore:backups:list --location europe-west4 --project sanem-prod
```

2. Restore into a new id (example: `restored-YYYYMMDD`):

```bash
pnpm exec firebase firestore:databases:restore \
  --backup 'projects/sanem-prod/locations/europe-west4/backups/BACKUP_ID' \
  --database 'restored-YYYYMMDD' \
  --project sanem-prod
```

3. Wait until the restore operation finishes. The new database is not readable until then.

4. Check counts in the restored database (products, variants, orders) against what you expect.

5. Switch or copy:
   - Prefer: point a temporary App Hosting / admin check at the restored database, confirm data, then plan cutover.
   - Or: export/copy selected collections into `(default)` only after a written go from the owner.
   - Do not delete `(default)` until a verified restored database exists and a rollback plan is written.

TTL policies and App Engine search data are not in the backup.

### Optional uptime check

Cloud Monitoring → uptime check on production `/` → email alert to the ops inbox. Optional for this unit; add at ship if desired.

## Monthly cost and budget

Budget alert: required on both Firebase projects (Blaze). Record the alert threshold here at ship.

## Admin guide

Client-facing admin screenshots live in `docs/admin-guide.md` (written at ship).

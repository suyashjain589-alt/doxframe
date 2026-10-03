# DOXFRAME V23.2.6 — FINAL PRODUCTION CANDIDATE DEPLOYMENT

This release is the clean fresh-deployment baseline for DOXFRAME. It preserves the security, SEO and subscription work from V22.1.13 while fixing the fresh D1 migration chain and removing stale deployment references.

## Current release

- Package version: `23.2.6`
- Canonical site: `https://doxframe.com`
- D1 database name: `doxframe-db`
- D1 database ID: **must be created for this fresh deployment and inserted into `wrangler.jsonc`**
- Legacy WINGFILE database IDs/names: not used
- Legacy Razorpay `RAZORPAY_PLAN_ID`: not required

## 1. Create the fresh D1 database

Create a new database before deploying:

```bash
npx wrangler d1 create doxframe-db
```

Copy the returned `database_id` into `wrangler.jsonc`, replacing:

```text
REPLACE_WITH_NEW_D1_DATABASE_ID
```

Do **not** reuse the deleted/old D1 ID.

Then apply all migrations to the new database:

```bash
npx wrangler d1 migrations apply doxframe-db --remote
```

The migration chain is designed for a fresh database and has been validated as:

```text
0001 → 0002 → 0003 → 0004 → 0005 → 0006 → 0007
```

`email_verified_at` is created only by `0001_initial.sql`; `0004_email_verification.sql` no longer attempts to add it a second time.

## 2. Worker secrets

### Core — required

- `AUTH_PEPPER`
- `RESEND_API_KEY`
- `FROM_EMAIL`

### Security / bot protection — required for the corresponding features

- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET`
- `TURNSTILE_HOSTNAME`
- `MFA_ENCRYPTION_KEY` — exactly 32 random bytes encoded as base64/base64url

### Billing — required for Pro subscriptions

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_PRO_MONTHLY_PLAN_ID` — ₹149/month plan
- `RAZORPAY_PRO_ANNUAL_PLAN_ID` — ₹999/year plan
- `RAZORPAY_WEBHOOK_SECRET`
- optional `RAZORPAY_MONTHLY_TOTAL_COUNT` (default 1200)
- optional `RAZORPAY_ANNUAL_TOTAL_COUNT` (default 100)

Never place production secrets in Git, browser JavaScript, HTML, `wrangler.jsonc`, or this ZIP.

## 3. Razorpay

Create the monthly and annual Pro plans in Razorpay and put their Plan IDs in the two explicit variables above. The application no longer depends on the legacy `RAZORPAY_PLAN_ID` variable.

Configure the webhook endpoint as:

`https://doxframe.com/api/billing/webhook`

Test subscriptions and webhook reconciliation in Razorpay Test Mode before enabling live credentials.

## 4. Turnstile and Resend

Create a Turnstile widget for `doxframe.com`, configure the matching site key, secret and exact hostname, and use a verified Resend sender address.

## 5. Deploy

```bash
npm install
npx wrangler deploy
```

Before deployment, verify that `wrangler.jsonc` contains the newly created D1 `database_id`. Deployment must not proceed while the placeholder remains.

## 6. Custom domain

Attach `doxframe.com` to the Worker in Cloudflare. Keep the canonical domain unchanged unless a deliberate domain migration is planned.

## 7. Post-deployment smoke/security test

Verify:

1. `/health` returns HTTP 200 without sensitive configuration disclosure.
2. `/api/health` reports D1 availability.
3. Registration → verification → login works.
4. Password reset works and invalidates old sessions.
5. MFA setup/enable/login/disable works when configured.
6. Free/Pro usage limits are enforced server-side.
7. Razorpay monthly and annual checkout work with the correct Plan IDs.
8. Razorpay webhook signatures and idempotency work.
9. Account deletion and active-subscription protections work.
10. 50 MB file limit is enforced.
11. Canonical redirects, sitemap and robots work.
12. `https://doxframe.com/sitemap.xml` contains only canonical public URLs.

## Release organization

`23.2.6` is the current release candidate. Earlier V22.1.x references in changelogs/audit notes are historical and are not deployment instructions.

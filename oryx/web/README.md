# EVNTSZN / EPL Web

Production-intended ORYX web platform for EVNTSZN and EVNTSZN Prime League.

## Platform Scope

- EVNTSZN event and ticketing platform
- Organizer, attendee, venue, and admin operating surfaces
- Mobile-first scanner and check-in workflow
- Stripe webhook-first ticket issuance
- Printful-backed merch and order operations
- EPL league registration, staffing, sponsorship, revenue, merch, draft, and league office tooling

## Architecture

- `app/*`: mounted Next.js 16 App Router surface
- `src/lib/*`: shared server/client platform libraries
- `proxy.ts`: host-aware public vs preview routing split
- `supabase/migrations/*`: source-controlled EVNTSZN and EPL schema
- `scripts/smoke.mjs`: post-build route and contract verification

The legacy `src/app/*` EPL tree is excluded from build ownership. The mounted runtime lives in `app/*`.

## Required Environment

Set the values in `.env.local` from `.env.example`.

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PRINTFUL_API_KEY`
- `RESEND_API_KEY`
- `MERCH_FROM_EMAIL`
- `PUBLIC_HOST`
- `PREVIEW_HOST`

Important:

- Treat any previously committed or shared local secrets as compromised and rotate them.
- `SUPABASE_SERVICE_ROLE_KEY` must stay server-side only.
- `PUBLIC_HOST` is the public EVNTSZN domain. `PREVIEW_HOST` is the full-access operational host.

## Local Development

1. Install dependencies:

```bash
npm ci
```

2. Apply Supabase migrations to your environment.

3. Start the app:

```bash
npm run dev
```

4. Validate before shipping:

```bash
npm run lint
npm run typecheck
npm run build
npm run smoke
```

## Supabase Notes

This repo now source-controls:

- EVNTSZN event/ticketing core tables
- EPL operating schema tables
- EPL public/admin/draft views
- EPL draft and operations RPCs

Runtime expectations still require:

- Supabase Auth configured for platform users/admins
- Storage bucket support for `epl-player-photos`
- RLS and environment-specific auth policies aligned with your deployment model

## Deployment

- Public host exposes public EVNTSZN and EPL registration/store surfaces only.
- Preview host exposes the full operational product.
- Stripe webhooks must target `/api/stripe/webhook`.
- Build output and smoke checks should pass before deployment promotion.

## CI

GitHub Actions workflow: `.github/workflows/ci.yml`

It runs:

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run smoke`

## Operational Follow-Up

- Rotate any secrets previously stored in local env files.
- Apply migrations in a non-production environment first and validate real Supabase data compatibility.
- Backfill EPL production data into the new source-controlled schema if an unmanaged database already exists.

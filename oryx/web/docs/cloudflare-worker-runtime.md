# Cloudflare Worker runtime configuration

EVNTSZN uses two different runtime contexts:

1. Local build and local preview
2. Deployed Cloudflare Worker runtime

These must be configured deliberately. Do not assume `.dev.vars` values automatically become deployed Worker secrets.

## Local development

Use one local source of truth:

- `.env.local` for Next.js build-time values
- `.dev.vars` only when you need Wrangler local runtime secrets

If both exist, keep the Supabase keys identical.

Required local values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_ORIGIN`
- `NEXT_PUBLIC_EPL_ORIGIN`
- `NEXT_PUBLIC_SCANNER_ORIGIN`
- `NEXT_PUBLIC_OPS_ORIGIN`
- `NEXT_PUBLIC_HQ_ORIGIN`
- `NEXT_PUBLIC_ADMIN_ORIGIN`

## Deployed Cloudflare Worker runtime

Set these explicitly for the Worker:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_ORIGIN`
- `NEXT_PUBLIC_EPL_ORIGIN`
- `NEXT_PUBLIC_SCANNER_ORIGIN`
- `NEXT_PUBLIC_OPS_ORIGIN`
- `NEXT_PUBLIC_HQ_ORIGIN`
- `NEXT_PUBLIC_ADMIN_ORIGIN`

Recommended commands:

```bash
wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Use `wrangler.jsonc` only for non-secret defaults. Keep the service role key out of the config file.

## Verification

After deploy:

```bash
wrangler tail evntszn-prod-live
```

Homepage requests should no longer emit uncaught render failures even if an upstream content source is unavailable.

# MIXDEN Creative

Standalone production app for `https://mixdencreative.com`.

This site is intentionally isolated:

- separate Next.js app folder
- separate routes and components
- separate deployment target
- separate runtime environment variables

## Local Verification

From the repo root:

```bash
cd mixdencreative
npm run check:isolation
npm run lint
npm run typecheck
npm run build
```

## Environment Variables

Create `mixdencreative/.env.local` from `mixdencreative/.env.local.example`.

Production values:

- `NEXT_PUBLIC_MIXDEN_CREATIVE_ORIGIN=https://mixdencreative.com`
- `HAPIO_API_TOKEN=<set as secret/private variable only>`
- `NEXT_PUBLIC_HAPIO_BOOKING_URL=<optional public Hapio booking URL>`
- `HAPIO_API_BASE_URL=<optional authenticated Hapio API endpoint>`

Notes:

- `NEXT_PUBLIC_MIXDEN_CREATIVE_ORIGIN` drives `metadataBase` and canonical URL generation.
- `HAPIO_API_TOKEN` is only read server-side in `app/api/hapio/route.ts`.
- Never expose `HAPIO_API_TOKEN` in client code or public env variables.
- If you only have a public Hapio booking link, set `NEXT_PUBLIC_HAPIO_BOOKING_URL` and leave `HAPIO_API_BASE_URL` empty.

## Logo Placement

Source logo:

- `/Users/MixdenCreativeAdmin/Downloads/MIXDEN Creative Logo.PNG`

Bundled asset:

- `mixdencreative/public/images/mixden-creative-logo.png`

## Production Deployment Target

Because this app includes a Next.js route handler at `/api/hapio`, it is prepared for the current Cloudflare-supported full-stack deployment path using OpenNext on Cloudflare Workers.

References:

- Cloudflare Next.js docs: full-stack SSR apps should use the Workers guide, while static Next.js Pages guidance is for static output only.
- OpenNext Cloudflare docs: `@opennextjs/cloudflare` supports App Router and Route Handlers on Cloudflare Workers.

Files added for this deployment target:

- `open-next.config.ts`
- `wrangler.jsonc`
- `public/_headers`

Useful commands:

```bash
cd mixdencreative
npm run cf:build
npm run cf:preview
npm run cf:deploy
```

## Cloudflare Setup

Recommended separate production target:

- Worker name: `mixden-creative`
- Root directory: `mixdencreative`
- Build command in CI: `npm run cf:build`
- Worker deploy command: `npm run cf:deploy`

If you are creating this through the Cloudflare dashboard, create a completely separate project or Worker for MIXDEN Creative. Do not attach this domain to any existing production app.

## Custom Domain: `mixdencreative.com`

To connect the apex domain in Cloudflare:

1. Open the standalone MIXDEN Creative deployment target in the same Cloudflare account and zone that manages `mixdencreative.com`.
2. Add `mixdencreative.com` as a custom domain on the standalone MIXDEN Creative target.
3. Add `www.mixdencreative.com` only if you also want the `www` host.
4. Let Cloudflare create or guide the required DNS mapping for the new target.
5. Confirm the domain is attached to the MIXDEN Creative target only.

## DNS Confirmation Checklist

After attaching the custom domain:

1. In the Cloudflare DNS tab, confirm the apex record for `mixdencreative.com` points to the standalone MIXDEN Creative target created for this app.
2. Confirm there is no domain attachment for `mixdencreative.com` on any other production app.
3. Load `https://mixdencreative.com` and confirm the served content matches this app.
4. Load `https://mixdencreative.com/api/hapio` and confirm the response comes from the standalone app.

## Isolation Verification Checklist

Use these checks before or after production launch:

1. Run `npm run check:isolation` inside `mixdencreative`.
2. Search for blocked references manually with `rg -n -i "evntszn|evntszn\\.com|NEXT_PUBLIC_APP_URL|NEXT_PUBLIC_SITE_URL|PUBLIC_HOST|PREVIEW_HOST|SUPABASE|STRIPE" mixdencreative`.
3. Confirm the app only uses `NEXT_PUBLIC_MIXDEN_CREATIVE_ORIGIN`, `HAPIO_API_TOKEN`, `NEXT_PUBLIC_HAPIO_BOOKING_URL`, and optional `HAPIO_API_BASE_URL`.
4. Confirm the custom domain `mixdencreative.com` is attached only to the standalone MIXDEN Creative deployment target.

## How To Confirm This Site Is Not Connected To The Existing Event Platform

1. The source lives only under `mixdencreative/`.
2. The canonical origin resolves to `https://mixdencreative.com`.
3. The booking route is `/api/hapio` inside this app only.
4. The isolation check fails if blocked legacy names or env keys are introduced into this app.

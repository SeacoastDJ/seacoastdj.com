# Hostinger deployment — social.seacoastdj.com

This release is a separate private application at `social.seacoastdj.com`. It does not replace or modify the public seacoastdj.com website, and the two are deployed independently.

## Before deployment

1. Test the complete workflow locally (`npm run dev`, `npm test`).
2. Confirm a strong `ADMIN_PASSWORD` and `SESSION_SECRET` are ready.
3. Remove any test event media from `storage/uploads` and `storage/data/projects.json`.

## Application configuration

In Hostinger hPanel, create a Node.js web application for `social.seacoastdj.com` (Node 20 or newer). Set the application entry file to:

```text
app.js
```

If the Node.js Git integration supports scoping a deploy to a subdirectory, point it at the `social-studio/` folder of the `seacoastdj.com` repo so pushes to `main` deploy it automatically. If it does not support a subdirectory, deploy `social-studio/` as its own packaged push instead, and repeat that after each relevant commit.

Install packages with `npm install --omit=dev`, then set these environment variables directly in Hostinger's environment-variable panel (never commit them, never paste real secret values into chat):

```text
NODE_ENV=production
PORT=<value supplied by Hostinger>
APP_NAME=Seacoast DJ Social Studio
SESSION_SECRET=<long random value — Claude can generate and set this>
ADMIN_EMAIL=<Billy's private administrator email>
ADMIN_PASSWORD=<unique strong password — Billy sets this directly>
MAX_UPLOAD_MB=50
OPENAI_API_KEY=<optional, leave blank until enabled>
OPENAI_VISION_MODEL=gpt-5.4-mini
OPENAI_IMAGE_DETAIL=high
ANTHROPIC_API_KEY=<optional, leave blank until enabled>
ANTHROPIC_VISION_MODEL=claude-sonnet-5
```

Plus every Meta value from `INSTALL-META.md`.

**This tool's env-var update is a full replace, not a merge.** Every update must resend the complete set (all values above, together) or previously-set values get wiped.

## Storage

The application process needs write access to:

```text
storage/data
storage/uploads
```

Verify Hostinger's current application storage and upload limits before moving a large media library. Keep original event media backed up separately; this application should not be its only home.

## Production checklist

- HTTPS is active (`hosting_installSSLV1`/confirmed via `hosting_getSSLStatusV1`) before signing in — Meta's OAuth redirect URI requires `https://`.
- `NODE_ENV` is `production` so secure cookies are enabled.
- The default password is not in use.
- `/health` returns `{ "ok": true, "version": "1.0.0", "metaConfigured": true }`.
- Uploaded media cannot be opened after signing out.
- A backup policy covers `storage/data` and `storage/uploads`.
- The static site's `.htaccess` blocks `social-studio/*` from being served on the `seacoastdj.com` vhost (see the repo-root `.htaccess`) — this Node app is served entirely from its own subdomain instead.

## Database roadmap

`database/schema.sql` documents a possible future MySQL migration target. Do not import it; this app runs on flat JSON files in `storage/data`.

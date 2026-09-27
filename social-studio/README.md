# Seacoast DJ Social Studio v1.0

A private, mobile-friendly content workspace for Seacoast DJ. Approval-only Facebook Page and Instagram photo publishing through Meta's official APIs. Every observation, caption, image selection, and publishing action remains human-reviewed.

Forked and rebranded from Top Shelf Social Studio (built for a different business, Top Shelf Tile). See `CHANGELOG.md` for what changed in the fork.

## Included

- Password-protected dashboard
- Live Facebook Page and Instagram follower counts on the dashboard once Meta is connected
- Project and media intake, organized by vertical (Wedding, Corporate, Private, Rental)
- Up to 12 protected uploads per project, plus an optional second upload path: import straight from a shared Google Drive folder (one subfolder per event)
- JPG, PNG, WebP, MP4, and MOV support
- Client/venue privacy checklist
- Four-format local draft generator (no AI key required), 16 caption bodies across the four verticals
- Edit, copy, save, and approve workflow
- Responsive interface for Mac and phone
- Optional AI photo analysis: OpenAI Vision and/or Claude Vision, whichever key(s) you configure — select up to five photographs
- Automatic resize, orientation correction, and metadata stripping
- Visible-equipment, performance, privacy, quality, and lead-image recommendations
- Editable analysis confirmation before caption generation
- Hostinger-oriented configuration
- Encrypted server-side Meta token storage
- Facebook Page and Instagram professional-account connection status
- Explicit image and destination selection for every publishing action
- Short-lived signed media URLs for Meta ingestion
- Publication history with platform post IDs and timestamps

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Open <http://localhost:3000>. The default development login comes from `.env.example`; change it in your private `.env` file.

## Data and privacy

Project records are stored in `storage/data/projects.json`. Uploaded media is stored in `storage/uploads` and is delivered only through authenticated application routes. Do not place `storage` inside a separately configured public static directory. AI providers receive temporary resized JPEG representations rather than original files; re-encoding removes embedded EXIF/GPS metadata.

This app is designed for one administrator and a modest content library. The included MySQL schema documents a possible future database adapter. Social publishing is never automatic: only approved drafts can be sent, and each action requires confirmation.

## Vision configuration (optional, both are optional)

- OpenAI: set `OPENAI_API_KEY`. Optional `OPENAI_VISION_MODEL` (default `gpt-5.4-mini`), `OPENAI_IMAGE_DETAIL` (default `high`).
- Claude: set `ANTHROPIC_API_KEY`. Optional `ANTHROPIC_VISION_MODEL` (default `claude-sonnet-5`).

Both are billed separately from any consumer subscription. Never commit `.env` or expose either key in browser-side JavaScript. With neither key set, the free template generator still works fully — AI analysis just doesn't appear in the UI.

## Commands

- `npm run dev` — local development with automatic restart
- `npm start` — production process
- `npm test` — unit and package acceptance tests

See `INSTALL-MAC.md`, `INSTALL-HOSTINGER.md`, `INSTALL-META.md`, `INSTALL-DRIVE.md` (optional), and `CONTENT-PLAYBOOK.md`.

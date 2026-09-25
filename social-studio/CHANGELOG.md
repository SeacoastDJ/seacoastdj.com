# Changelog

## v1.0.0 — Seacoast DJ fork (2026-09-25)

Forked from Top Shelf Social Studio v1.2.0 (built for a different business, Top Shelf Tile) and rebranded for Seacoast DJ:

- Replaced the free-text `projectType` field with a locked `vertical` enum (Wedding, Corporate, Private, Rental), matching the same taxonomy already used in seacoastdj.com's GA4 event tracking.
- Rebuilt `draft-engine.js`'s caption templates: 16 caption bodies (4 formats × 4 verticals) in Seacoast DJ's brand voice, grounded in the business's real facts (20+ years, 200+ weddings, 500+ events, 75-mile radius from Hampton, NH) instead of tile-installation copy.
- Added `claude-vision-service.js`: an Anthropic Claude vision option alongside the existing OpenAI vision option, using the same normalized analysis shape so the rest of the app doesn't care which provider ran. Both are optional — the app works fully with neither key configured.
- Rebranded all views, the Meta OAuth error messages, and the install docs for Seacoast DJ.
- Reused the Meta OAuth/publish integration (`meta-service.js`, `meta-store.js`) essentially unchanged — it was already env-var driven with no business-specific logic.

Version reset to 1.0.0 for the fork; the source app's v1.0–v1.2 release notes and upgrade guides (Top Shelf Tile-specific) were not carried over.

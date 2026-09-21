# seacoastdj.com

Marketing and lead-gen site for Seacoast DJ, a mobile DJ business serving the NH Seacoast and New England. This repo is PUBLIC on GitHub: never commit credentials, private addresses, or client data.

## Business and booking flow

- Verticals: Wedding, Corporate, Private, Rental (gear). Direct corporate bookings are the most lucrative.
- **GigBuilder** is the CRM hub and also supplies public widgets: the Check Availability modal (form posts to gigbuilder.com `checkdates`) and the client login (`.gbClientArea`, via `webtools.js`).
- The native "Get a Fast Quote" inquiry form bypasses GigBuilder. It posts to `/contact-handler.php`, which emails the owner over SMTP (PHPMailer).
- **ScratchEvents** is an external national agency that offers corporate gigs in the area. On `/corporate/` it appears only as a credibility section (client-logo collage). It is not part of the booking pipeline on the site.
- Wedding planner tool page: `weddings/event-planning.php` (kept on purpose).

## Site architecture and deploy

- Static HTML (2026 template) plus PHP for the form handler. Shared `styles.css?v=2` and `script.js?v=3`. Bump the `?v=` query on every page after changing either file.
- Pages: `/`, `/weddings/`, `/corporate/`, `/private/`, `/services/` (hub), `/gear.html` (all rental/equipment content lives here), `/media.html`, `/mixes.html`, `/merch.html`, `/contact.html`, plus `thank-you.html`, `contact-success.html`, `contact-error.html`.
- Deploy: push to `main`. Hostinger Git auto-deploy publishes it. After `.htaccess` redirect changes, purge the CDN cache (Hostinger `clearWebsiteCacheV1`), since edges cache 301s.
- `.htaccess`: every redirect is an ordered `RewriteRule` with an absolute `https://seacoastdj.com/...` target so each legacy URL resolves in one hop. Do not add plain `Redirect` lines (LiteSpeed and local Apache order them differently). `/rentals/*` and `/website-intelligence/` return 410 Gone on purpose. www to non-www is last. http to https is handled by the Hostinger edge.
- `contact-handler.php` outcomes: honeypot -> `contact-success.html` (no analytics event); timing (<3s or >24h), validation, or SMTP failure -> `contact-error.html`; success -> 303 to `/thank-you.html?category=<Wedding|Corporate|Private|Rental|general>` (strict, case-sensitive whitelist).
- `smtp-config.php` holds SMTP credentials, is gitignored, and must stay out of the repo. Config files return an empty body when requested over HTTP, which is fine.
- `styles-oldvsai.css`, `wedding.css`, `audit.md`, `lighthouse-report.md` are stale leftovers.

## SEO decisions

- Public location is **service area only**: no street address or geo coordinates in pages or schema. Use "Hampton, NH" / "NH Seacoast" / New England in titles, metas, H1s, and schema.
- `/services/` stays as a hub page for SEO. Rental content is merged into `/gear.html`.
- Copy voice: short, benefit-forward, second person.
- Keep `sitemap.xml` in sync (11 URLs). Rentals are not listed.
- Open items: Google Business Profile in progress (add its URL to schema `sameAs` once verified); update The Knot / WeddingWire links to `/weddings/`.

## Analytics (GA4, gtag.js only, ID `G-L387ZT3N6W`, no GTM)

All site events are in `script.js` (`trackLeadFunnel`) except `generate_lead`, which lives in `thank-you.html`.

| Event | Fires when | Parameters |
| --- | --- | --- |
| `category_page_view` | Page has `body[data-event-category]` | `event_category` |
| `cta_click` | Click on any `[data-cta]` | `cta_label`, `page_path` |
| `form_start` | First focus in `form[data-lead-form]` | `form_location` (= `data-lead-form`), `event_category` (`data-event-category` or `general`) |
| `check_availability_open` | Click on `[data-modal-target="gigbuilder-modal"]` | `cta_location` (placement in `data-cta`), `event_category` |
| `check_availability_submit` | Submit of `form[name="checkdate"]` (native POST to gigbuilder.com) | `cta_location`, `event_category`, `transport_type: 'beacon'` |
| `generate_lead` | `thank-you.html` loads after server-confirmed success | `form_location`, `event_category` |

- `generate_lead` only fires when the URL has a valid `category` param and the navigation is not a reload. Refreshes, direct visits, and invalid categories send nothing. The honeypot and error pages never send it.
- `form_location` values: `wedding_inquiry_form`, `corporate_inquiry_form`, `private_inquiry_form`, `rental_inquiry_form`, `contact_form`. They must match between `form_start` and `generate_lead`.
- `event_category` values are locked: **Wedding, Corporate, Private, Rental** (plus `general` for contact.html). Do not rename them, and never change "Other Event" or any GigBuilder-side naming (tied to past booking records).
- GA4 property config (custom dimensions "Lead Vertical" = `event_category` and "CTA Location" = `cta_location`, key events, internal-traffic filter, explorations) is managed in the GA4 UI, not in code. Ask before changing it.
- Test a lead end to end with GA4 DebugView or the Network tab (`collect` requests). Tell the owner to delete the test email afterward.

## Working rules

- Pushing site changes to `main` is fine without asking. Ask first before changing GA4, DNS, or any account settings.
- Ground answers in the live site and current files before proposing changes.

# Seacoast DJ Lighthouse and Site Audit Report

**Date:** 2026-09-09  
**Production site:** https://seacoastdj.com/  
**Scope:** Lighthouse attempt, HTML/SEO checks, broken-link scan, and HTTP performance checks

## Executive Summary

The production sitemap contains 10 canonical URLs, and all 10 returned HTTP `200` during this scan. Basic server response times were healthy, ranging from approximately `0.25s` to `0.47s` for the tested pages.

The main broken-link issue is a group of legacy rental URLs returning `404`. The site also has structural HTML cleanup work remaining, especially in the older wedding packages page.

A Lighthouse run was attempted with `npx lighthouse`, but Chrome failed with `Execution context was destroyed`. Because the browser audit did not complete, no Lighthouse category scores are reported here.

## Lighthouse Status

### Result

- Lighthouse package: invoked through `npx lighthouse`
- Target: `https://seacoastdj.com/`
- Result: **Inconclusive; browser protocol failure**
- Failure: `Protocol error (Runtime.evaluate): Execution context was destroyed`
- Category scores: not available

This is an audit-tool/runtime failure, not a measured site score. Retry from Chrome DevTools Lighthouse or PageSpeed Insights for authoritative Performance, Accessibility, Best Practices, and SEO scores.

## HTTP Performance Scan

The following sitemap pages returned HTTP `200`:

| URL | Total response time | Downloaded bytes |
| --- | ---: | ---: |
| `/` | 0.465s | 12,660 |
| `/contact.html` | 0.267s | 5,013 |
| `/gear.html` | 0.319s | 3,829 |
| `/media.html` | 0.324s | 4,215 |
| `/merch.html` | 0.254s | 3,935 |
| `/mixes.html` | 0.322s | 4,575 |
| `/services/` | 0.434s | 24,051 |
| `/services/rentals.html` | 0.397s | 14,795 |
| `/weddings/` | 0.403s | 27,871 |
| `/weddings/wedding-packages.html` | 0.388s | 25,351 |

These are transfer timings from `curl`, not Core Web Vitals. They do not measure browser rendering, layout shift, interaction latency, image decode time, or third-party script impact.

## HTML and SEO Findings

### Verified strengths

- Canonical URLs are present on the primary pages.
- Page titles and meta descriptions are present on the sitemap pages.
- `robots.txt` and `sitemap.xml` are live and accessible.
- Homepage includes `ProfessionalService` JSON-LD.
- Open Graph metadata and favicon links are present.
- The contact form uses the correct Formspree endpoint.
- GA4 is loaded with measurement ID `G-L387ZT3N6W`.
- A `generate_lead` event is attached to the contact form submit action.
- Sitemap URLs are limited to current canonical pages.

### Structural findings

HTML Tidy reported diagnostics on all locally scanned sitemap pages. Counts are approximate diagnostics, not validation failure counts:

| File | Tidy diagnostics |
| --- | ---: |
| `index.html` | 17 |
| `contact.html` | 24 |
| `gear.html` | 16 |
| `media.html` | 17 |
| `merch.html` | 15 |
| `mixes.html` | 15 |
| `services/index.html` | 19 |
| `services/rentals.html` | 17 |
| `weddings/index.html` | 15 |
| `weddings/wedding-packages.html` | 46 |

The wedding packages page is the highest-priority HTML cleanup target because it contains older markup and third-party/legacy structures. Review diagnostics before changing it because some warnings may be caused by intentionally retained legacy embeds.

## Broken-Link Scan

### Confirmed broken URLs

These legacy routes return HTTP `404`:

- `/rentals/accessories.html`
- `/rentals/custom.html`
- `/rentals/lighting.html`
- `/rentals/microphones.html`
- `/rentals/mixers.html`
- `/rentals/speakers.html`
- `/rentals/terms.html`

They should be removed from internal links or redirected to real replacement pages. They are not included in the current sitemap.

### Legacy URL still live

- `/weddings/event-planning.php` returns HTTP `200`.

This route should either receive a canonical tag and remain intentionally supported, or redirect to the current wedding services page. It should not remain an accidental duplicate URL.

## Accessibility and UX Follow-Up

The static scan did not replace a real browser accessibility audit. Recommended browser checks:

- Keyboard navigation and visible focus states.
- Mobile navigation wrapping and tap target spacing.
- Hero/logo animation with reduced-motion enabled.
- Image slider controls and announced active state.
- Text overflow inside cards, buttons, captions, and form controls.
- Color contrast for muted text and secondary buttons.
- Form error and success announcements.

## Recommended Actions

1. Run Lighthouse through Chrome DevTools or PageSpeed Insights to obtain authoritative scores.
2. Fix or redirect the seven confirmed broken rental URLs.
3. Decide whether `/weddings/event-planning.php` is a supported canonical page or a redirect target.
4. Clean up the 46 diagnostics in `weddings/wedding-packages.html` first, then review the other pages.
5. Run browser-based mobile and desktop checks for layout shift, overflow, and keyboard access.
6. Confirm `generate_lead` events in GA4 Realtime/DebugView, then mark the event as a key event.
7. Compare GA4 leads with actual Formspree submissions.
8. Retry Lighthouse after the Chrome protocol issue is resolved.

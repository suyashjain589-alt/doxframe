# DOXFRAME 23.2.0 — Final Production Candidate

## Fixed in this release
- Added automatic URL-based bootstrap for all 21 standalone non-OCR tool pages.
- Removed redundant legacy per-tool bootstrap scripts and duplicate legacy tool implementations.
- Added server-side usage-tool IDs for Passport Photo Maker and Signature Resizer.
- Fixed passport output dimensions: 35×45 mm uses 413×531 px at 300 DPI; 2×2 inch uses 600×600 px.
- Reworked image target-size compression to search quality and dimensions and report whether the target was achieved or the closest result was produced.
- Reworked signature resizing around JPEG quality + dimension search instead of ineffective PNG quality controls.
- Synchronized the homepage to 22 tools.
- Restored and smoke-tested the ZIP generation helper used by batch downloads.
- Added a 250-page browser safety guard to PDF-heavy workflows to reduce memory/crash risk.
- Preserved client-side validation, rate limiting, security headers, PDF.js hardening, authentication, MFA, billing and quota architecture.

## Verified
- 22 tool HTML pages present.
- 22 sitemap tool URLs present.
- No duplicate top-level function declarations in `public/tools/tool-app.js`.
- `worker.js`, `tool-app.js`, and `a11y.js` pass Node syntax checks.
- Production secrets are not bundled.

## Deployment requirement
Cloudflare D1 `database_id` and production secrets must be configured in the deployment account before `npm run deploy`. The repository intentionally does not contain account secrets.

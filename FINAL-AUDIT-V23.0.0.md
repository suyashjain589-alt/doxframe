
> V23.1 UI polish is shipped in `UI-RELEASE-V23.1.md`. The V23.0 security/functionality baseline is retained.
# DOXFRAME 23.0.0 — Final Local Release Audit

Date: 2026-09-30

## Validation completed
- `npm run check` passes: worker.js, tool-app.js and a11y.js syntax checks pass.
- All internal HTML href targets checked: 0 missing internal targets.
- New tool pages return HTTP 200 in a local static-server smoke test.
- Sitemap parses as valid XML.
- Homepage tool cards: 22.
- Tool pages: 22.
- D1 migrations retained unchanged.

## Implemented in this release
- Target-size Image Compressor (20/50/100/200/500 KB + custom).
- Image Converter (JPG/PNG/WebP, batch ZIP output).
- Passport Photo Maker.
- Signature Resizer.
- Bulk Image Resize now exports a ZIP archive.
- PDF-to-JPG multi-page output now exports a ZIP archive.
- PDF compression modes: High Quality / Balanced / Smallest. Balanced/Smallest use local rasterization and explicitly warn about flattened text.
- Duplicate eager data-action binding removed from a11y.js; delegated action handling remains.
- Added format/privacy/complex-document limitations to relevant tool pages.
- Added SEO landing pages and sitemap entries for the new tools.
- Added automated D1 preparation script.
- Added release notes and a local validation command.

## Account/deployment-dependent items
A real Cloudflare D1 database ID cannot be fabricated or embedded safely without access to the user's Cloudflare account. The release therefore includes `scripts/prepare-deploy.mjs`, which creates `doxframe-db` and writes its real ID into `wrangler.jsonc` when run while authenticated with Wrangler.

Run:
1. `npm install`
2. `npm run prepare:deploy`
3. `npx wrangler d1 migrations apply doxframe-db --remote`
4. Configure production secrets.
5. `npm run check`
6. `npm run deploy`

## Remaining capability limitations
- True AI subject segmentation for complex background removal is not bundled; the existing tool remains solid-color/background removal.
- PDF-to-Word and PDF-to-Excel remain extraction-oriented browser conversions; exact layout/table reconstruction requires a dedicated conversion/OCR engine.
- A true server-side PDF image optimizer would require an additional backend processing dependency; the new browser compressor provides stronger local compression through rasterization but may flatten text.
- Razorpay, Resend, Turnstile and Cloudflare account configuration must be tested in the user's own production account.

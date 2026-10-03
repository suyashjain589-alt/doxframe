# DOXFRAME V23.2.7 — Web Audit Hardening

- Normalized SEO canonical, Open Graph and JSON-LD URLs to the current `workers.dev` deployment.
- Rebuilt `sitemap.xml` with a valid `lastmod` on every URL and all 22 tools plus guide/legal pages.
- Added missing canonical/description metadata to 404, reset-password and verify-email pages.
- Added accessible names to search, feedback and OCR controls and file inputs.
- Repaired file-input markup.
- Worker security response now removes common information-disclosure headers where controllable.
- Increased HSTS max-age and kept CSP explicit; no COEP `require-corp` was added because the application does not use SharedArrayBuffer/cross-origin isolation and doing so would risk breaking existing CDN workflows.
- Preserved existing CDN/SRI architecture; self-hosting was not performed because the build environment could not fetch external CDN assets.
- DNS-only findings (CAA/SPF/DMARC/nameservers/DNSSEC) remain registrar/zone configuration items, not Worker code changes.

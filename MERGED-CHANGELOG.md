## V22.1.14 — Fresh Deployment Hardening
- Fixed duplicate `email_verified_at` migration so a fresh D1 can apply 0001–0007 cleanly.
- Removed the deleted/old D1 ID from deployment configuration; fresh setup requires a newly created `doxframe-db` ID.
- Removed reliance on legacy `RAZORPAY_PLAN_ID`; public billing detection now uses the explicit monthly/annual plan IDs.
- Rewrote deployment instructions for the fresh Cloudflare/D1 setup.
- Marked older audit/deployment notes as historical.

## V22.1.12 — Deep SEO Hardening
- Deep audit and hardening of image SEO, indexability, homepage search intent, tool-page content depth and FAQ coverage.
- Added WebP display assets and intrinsic image dimensions.
- Added noindex to auth/error utility pages.

## V22.1.11
- Updated Privacy, Terms and Cookies notices to match current service providers and data-rights/grievance flows.
- Added Resend disclosure and conditional international-processing disclosure.
- Clarified cancellation/refund handling and jurisdiction/legal-review requirements.

# DOXFRAME V22.1.4 — Security Hardened

- Fixed CSP coverage for all executable inline scripts and allowed only the pinned third-party script origins required by the current tools.
- Replaced browser `prompt()`/`alert()` MFA flows with accessible in-page dialogs.
- Added password KDF hardening to 210,000 PBKDF2-SHA256 iterations for new passwords and transparent legacy-account rehashing after successful authentication.
- Added defense-in-depth sanitization for generated Mammoth/SheetJS HTML before DOM insertion.
- Re-ran JavaScript syntax, CSP hash, canonical-route and package-integrity checks.

# DOXFRAME V22.1.1 — FINAL PRODUCTION CHANGELOG

## Final cleanup

- Bumped package version to `22.1.1`.
- Bumped Worker health marker to `22.1.1-production`.
- Removed stale V18/V21 release headers and deployment instructions from the active README.
- Corrected secret configuration documentation so Turnstile, Resend and sender variables are listed separately.
- Clarified MFA deployment requirements and the current implemented MFA flow.
- Removed duplicate legacy alias HTML documents.
- Retained all legacy URL redirects in `public/_redirects`.
- Removed stale version labels from frontend comments.
- Kept historical source/version references only where they describe the merge lineage or migration history.

## Merged product features

- DOXFRAME production platform and tool ecosystem.
- SLIKAART-inspired PDF edit workspace improvements.
- PDF page reorder, rotate, delete, duplicate and blank-page insertion.
- PDF edit undo/redo and page editing controls.
- Mobile touch/UI improvements.
- Cloudflare Worker + D1 backend.
- Authentication, email verification, password reset and optional TOTP MFA.
- Turnstile protection and rate limiting.
- Razorpay billing and server-side usage limits.
- SEO, canonical URLs, sitemap, robots and guides.
- Browser-first file processing.

## Verification scope

Static checks cover package integrity, syntax, canonical routes, local references, redirects and release/version consistency. Live third-party service behavior remains deployment-dependent and must be smoke-tested with real configuration.

## 2026-09-26 — DOXFRAME logo refresh
- Replaced the previous DOXFRAME brand asset with the user-supplied final logo artwork.
- Added a compact header composition derived from the supplied logo for responsive navigation.
- Updated the favicon/app mark from the same supplied artwork for consistent branding.


## V22.1.4 — Final hardening cleanup
- MFA endpoint throttling
- Account deletion rehash fix
- Webhook payload size limit
- 18-tool UI count consistency
- Removed stale source artifact

## V22.1.7
- Deep authentication/session hardening
- MFA challenge concurrency protection
- Host-only auth cookies
- Health endpoint disclosure reduction
- Additional security headers


## V22.1.13 — Subscription Pricing
- Pro Monthly: ₹149/month.
- Pro Annual: ₹999/year.
- Checkout accepts a validated monthly/annual billing cycle and selects the corresponding Razorpay Plan ID.
- Preserved legacy monthly `RAZORPAY_PLAN_ID` fallback for deployment compatibility.
- Added deployment variables and updated Terms/pricing UI.

# DOXFRAME V23.2.4 — Deep Security Audit

Date: 2026-09-30

## Scope
Fresh source-level defensive audit of the V23.2.3 release after independent review. Covered Worker API/authentication, sessions/cookies, CSRF/origin checks, rate limiting, password reset/email verification, MFA, billing/webhooks, job quota/ownership, DOM/XSS sinks, generated HTML sanitization, file/image/PDF resource limits, CSP/security headers, dependency loading, migrations and release integrity.

## Fixes in V23.2.4
- State-changing browser requests without a same-origin Origin header now fail closed instead of trusting merely same-site Fetch Metadata.
- Password-reset requests now participate in Turnstile verification whenever Turnstile is configured.
- Password-reset UI forwards the existing auth Turnstile token.
- Removed duplicate email-verification database update.
- Generated document HTML sanitizer now removes external HTTP(S), protocol-relative, javascript:, vbscript:, and HTML data URLs; CSS `url(...)` is removed from generated styles.
- Added verified SRI to exact-version pdf-lib, html2canvas and jsPDF loads where hashes are available.
- Dynamic loader uses the same verified SRI metadata for those libraries.
- Version and audit metadata updated to 23.2.4.
- Added audit checks for fail-closed unsafe requests, duplicate verification updates, reset protection and generated-HTML URL sanitization.

## Verified
- JS syntax: PASS
- Worker syntax: PASS
- Final structural audit: PASS
- 22 tool pages: PASS
- 22 homepage tool links: PASS
- 22 sitemap tool links: PASS
- Duplicate top-level tool functions: 0
- SQL interpolation: none found in audited Worker paths
- Session tokens: random + hashed at rest
- HttpOnly/Secure/SameSite session cookies
- MFA challenge is short-lived and atomically consumed
- Recovery codes are single-use with atomic consumption
- Razorpay webhook signature + event replay protections present
- Job ownership uses authenticated user subject or IP subject key
- Browser file/image/PDF safety limits present
- Generated DOCX/Excel HTML is sanitized before rendering

## Remaining deployment hardening note
Five external script tags still do not have verified SRI metadata in the source package. These are third-party libraries whose exact bytes were not available in this build environment. No fabricated hashes were inserted. For a strict production supply-chain gate, vendor these libraries under `/public/vendor/` (preferred) or add hashes generated from the exact downloaded files. This is a supply-chain hardening item, not a confirmed application exploit.

A package-lock could not be generated offline because the npm registry/package metadata was unavailable in the build environment. The existing Wrangler version remains explicitly pinned in package.json.

## Production-only verification still required
Cloudflare D1 database ID/bindings, production secrets, deployed response headers, Razorpay webhook configuration, Turnstile hostname/secret and actual production routing must be verified after deployment.

# DOXFRAME V23.2.5 — Deep Security Audit

## Verified fixes
- Authentication/session hardening retained and rechecked.
- Password reset rate limiting + Turnstile retained.
- MFA challenge is atomically consumed before session creation.
- MFA recovery codes are atomically single-use.
- TOTP now records and rejects reuse of the same accepted time-step.
- New MFA secret provisioning clears the previous replay counter.
- Email verification token is atomically consumed before account activation.
- SQL query interpolation scan: no unsafe interpolation found in application queries.
- XSS/HTML URL sanitization paths retained and rechecked.
- Upload/body/page/pixel/resource limits retained.
- Razorpay webhook HMAC/idempotency/ownership protections retained.
- Security headers/CSP/security.txt retained.
- 22 tool pages, 22 homepage links and 22 sitemap links verified.
- Duplicate top-level functions: none.

## Supply-chain status
Verified SRI is present for pdf-lib, jsPDF, html2canvas and Tesseract.js. Four browser dependencies still require either local vendoring or verified SRI before a strict zero-CDN supply-chain gate can be claimed: Mammoth 1.8.0, SheetJS 0.20.3, docx 9.5.1, and the dynamic pdf.js 6.3.289/docx imports.

The build environment cannot resolve external package/CDN hosts, so their exact bytes cannot safely be copied into this ZIP. No guessed hashes or fake vendor files were added.

## Deployment requirement
Apply `migrations/0008_mfa_totp_replay_guard.sql` to the production D1 database before enabling the V23.2.5 Worker.

## Result
Source-level security audit: PASS with an explicit external-dependency supply-chain warning. Production Cloudflare/D1/Razorpay/Turnstile configuration still requires live verification.

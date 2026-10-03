# DOXFRAME V22.1.6 — Security Hardened Release Audit

## Fixed in this release

### P0 — CSP compatibility
- Recomputed the SHA-256 allowlist for every executable inline script in the public HTML.
- Result: 24 executable inline scripts, 24 matching CSP hashes, 0 missing hashes.
- Added only the third-party script origins currently required by the pinned browser libraries and Cloudflare Turnstile.
- Kept `script-src-attr 'none'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, and `form-action 'self'`.

### P1 — MFA UX
- Removed browser `prompt()` and `alert()` from MFA flows.
- Added accessible in-page dialogs for:
  - login MFA code
  - MFA setup secret/URI
  - MFA enable code
  - MFA disable password
  - MFA disable code
- Added one-time-code/password autocomplete hints and keyboard/escape handling.

### P1 — Password KDF hardening
- New passwords use PBKDF2-SHA256 with 210,000 iterations.
- Existing 120,000-iteration accounts remain compatible.
- After a successful legacy-password authentication, the account is transparently rehashed at the stronger cost.
- This avoids forcing existing users through a password reset.

### P2 — Generated document HTML sanitization
- Added defense-in-depth sanitization before inserting Mammoth-generated Word HTML or SheetJS-generated spreadsheet HTML into the DOM.
- Removes scripts, iframes, objects, embeds, forms, base/meta/link elements, event-handler attributes, and dangerous javascript/data-text HTML URLs.

### P2 — External dependency hardening
- Third-party scripts remain version-pinned.
- CSP now explicitly permits only the CDN origins required by the current tool set.
- SRI hashes were not fabricated: exact CDN bytes were not available in the offline build environment. For the strongest supply-chain posture, self-hosting or verified SRI hashes should be added during a connected deployment build.

## Automated checks passed

- `worker.js` syntax: PASS
- `tool-app.js` syntax: PASS
- `a11y.js` syntax: PASS
- Executable inline-script syntax checks: PASS (24/24)
- CSP hash coverage: PASS (24/24)
- MFA prompt/alert scan: PASS (0)
- Homepage canonical tool links: PASS (18/18)
- Canonical tool HTML files: PASS (18/18)
- Package version: `22.1.6`
- Worker health version: `22.1.6-production`
- ZIP integrity: verified after packaging

## Deployment-only checks still require the live environment

A source ZIP cannot prove live Cloudflare/D1/Razorpay/Turnstile/Resend behavior. After deployment, run the documented production smoke test for authentication, email, MFA, quotas, billing/webhooks, account deletion, mobile browsers, and CSP console errors.

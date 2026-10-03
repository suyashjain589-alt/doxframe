# DOXFRAME V23.2.6 — Final Security Release Gate

## Verified in this build
- Authentication/session/password-reset/email-verification controls audited.
- MFA challenge consumption and TOTP replay guard present.
- SQL access reviewed for parameterized queries; no interpolation pattern found.
- XSS/HTML sanitizer paths reviewed, including dangerous URL protocols and CSS URLs.
- PDF.js scripting disabled and file/image/PDF resource limits present.
- Billing webhook HMAC/idempotency and ownership checks present.
- Security headers/CSP configuration reviewed.
- 22 tool pages, homepage inventory and sitemap inventory checked.
- Release package, manifest and audit version are synchronized to 23.2.6.

## External dependency gate
The application still references third-party browser libraries from external CDNs. Verified SRI is present where the exact asset digest is known. The remaining libraries must be vendored/self-hosted (or supplied with independently verified SRI) before claiming complete supply-chain isolation.

This is intentionally a release gate rather than a fabricated pass: no unverified hash is accepted.

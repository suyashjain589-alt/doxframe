> HISTORICAL DOCUMENT — retained for audit/change history. Do not use this file as current deployment instructions. Current release: V22.1.14.

# DOXFRAME V22.1.7 — Final Code-Level Audit

## Status
This release contains the final code-level hardening pass requested after the V22.1.3 audit.

### Fixed in V22.1.7
- MFA enable endpoint: dedicated rate limiting (6 attempts / 15 minutes).
- MFA disable endpoint: dedicated rate limiting (6 attempts / 15 minutes).
- Account deletion: user `id` is explicitly selected so legacy password rehash cannot reference an undefined id.
- Razorpay webhook: 256 KiB request-body cap, checked from Content-Length and again after reading the body.
- Homepage studio count synchronized to 22 tools.
- Removed stale `index_head.txt` source artifact.
- Package/Worker version bumped to `22.1.7` / `22.1.7-production`.
- Deployment documentation updated with the final hardening checklist.

## Automated verification
- Worker JavaScript syntax: PASS
- Tool application JavaScript syntax: PASS
- Accessibility JavaScript syntax: PASS
- Executable inline-script CSP coverage: PASS — 23 scripts / 23 unique hashes / 0 missing
- Tool pages: PASS — 18 canonical tool pages
- Homepage studio count: PASS — 18
- Native `prompt()` / `alert()` calls: PASS — 0
- Stale `index_head.txt`: PASS — removed
- MFA enable rate limit: PASS
- MFA disable rate limit: PASS
- Webhook 256 KiB cap: PASS

## Intentionally not fabricated
### Final domain
The package still uses `doxframe.com` as its current canonical/deployment domain because no replacement domain was supplied. A domain migration should only be performed after the owner provides the exact domain.

### CDN SRI
Exact upstream CDN bytes were unavailable in the offline build environment, so SRI hashes were not invented. The CDN versions are pinned and the CSP allowlist is restricted to the required origins. SRI can be added when the exact upstream assets are available for verification.

## Production verification still requires deployment
Cloudflare Worker/D1, Turnstile, Resend, Razorpay, DNS, TLS, and real-device/browser flows must be smoke-tested after deployment. A ZIP/source audit cannot honestly certify those live integrations.

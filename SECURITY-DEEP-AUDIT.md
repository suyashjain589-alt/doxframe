# DOXFRAME V22.1.9 — Deep Security Hardening Audit

## Fixed in this build
- Implemented the missing login endpoint.
- Added IP + email login rate limiting.
- Enforced Turnstile on authentication.
- Added generic credential failure responses.
- Added MFA challenge creation, expiry and attempt limits.
- Atomically consumed MFA challenges to prevent concurrent double-login.
- Switched session storage/lookup/logout to the same peppered session hash.
- Migrated authentication cookies to `__Host-` cookies.
- Reduced public health endpoint information disclosure.
- Added additional browser isolation/security headers.
- Added `mfa_challenges` to the canonical schema as well as migration 0007.

## Supply-chain note
The application still references pinned third-party browser libraries by exact version. This build does not invent SRI hashes: exact CDN bytes were not available in the build environment. Full supply-chain hardening should self-host audited dependency bytes or add verified SRI hashes after obtaining the exact release artifacts.

## Static verification
- JavaScript syntax: verified with Node `--check`.
- No duplicate `login` definitions.
- Session hash writer/reader/logout paths use `sessionHash`.
- MFA challenge table exists in schema and migration.
- ZIP integrity verified after packaging.

A static audit cannot prove live Cloudflare, D1, Turnstile, Resend, Razorpay, DNS, secrets, browser behavior, or third-party CDN integrity.


## V22.1.9 Deep-Audit Remediation

- Upgraded browser jsPDF references from 2.5.2 to 4.2.1. jsPDF 4.2.1 is the patched release for the 2026 HTML-injection advisory.
- Standardized PDF.js references to 6.3.289 and removed the older 4.4.168/4.10.38 split.
- All PDF.js `getDocument()` calls now explicitly set `isEvalSupported:false` and `enableScripting:false`, adding defense-in-depth for malicious PDFs.
- JSON API bodies are now read through a streaming byte cap even when `Content-Length` is absent; oversized requests return HTTP 413.
- Razorpay webhook bodies now use the same streaming 256 KiB cap before signature verification/JSON parsing.
- CDN/SRI hardening is intentionally not faked: exact CDN release bytes were not available in the build environment, so no invented integrity hashes were added.

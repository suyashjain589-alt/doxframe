# DOXFRAME V23.2.5 — Security Hardening

- Added atomic TOTP time-step replay protection to MFA credentials.
- Added migration `0008_mfa_totp_replay_guard.sql`.
- Reset TOTP replay state whenever a new MFA secret is provisioned.
- Made email verification token consumption atomic before account activation.
- Added verified SRI to Tesseract.js 5.1.1 and moved it to cdnjs.
- Preserved existing upload, parser, XSS, CSRF, rate-limit, billing and webhook hardening.

## Remaining deployment action

The build environment cannot download third-party browser library bytes, so the final ZIP cannot safely invent or embed vendor copies. The remaining external browser libraries must be vendored from their exact pinned upstream releases during deployment/build if a zero-CDN trust boundary is required.

# DOXFRAME V23.2.3 Security Patch

## Applied hardening

- Reduced password-reset request rate limits to 2 per IP/hour and 2 per normalized email/hour.
- Added unbiased rejection-sampling generation for MFA recovery codes.
- Added browser canvas dimension and pixel ceilings for image conversion.
- Added PDF render-dimension/pixel ceilings to compression, PDF-to-JPG, split preview and organise-PDF rendering paths.
- Added Subresource Integrity (SRI) to the jsPDF static dependency where an authoritative published integrity value is available.
- Re-ran syntax and final structural audits.

## Remaining deployment requirement

Cloudflare Worker secrets, D1 binding, deployed response headers and production webhook configuration must be verified after deployment.

## Supply-chain note

Critical third-party browser libraries remain pinned to exact CDN versions. Full same-origin vendoring requires retrieving and committing the exact upstream distribution artifacts; the build environment used for this patch did not have outbound package/CDN download access. No unverified local replacement artifacts were fabricated.

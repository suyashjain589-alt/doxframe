# DOXFRAME V23.2.0 Final Static Release Audit

Date: 2026-09-30

## Verified
- 22 tool pages present and matched to the expected inventory.
- 22 homepage tool links and 22 sitemap tool URLs.
- No duplicate top-level functions in `public/tools/tool-app.js`.
- Universal standalone tool bootstrap present.
- New-tool usage/quota mappings present in client and Worker allowlist.
- JS syntax checks pass for Worker, tool engine and accessibility layer.
- Local public references resolve.
- No duplicate HTML IDs detected.
- No executable inline scripts requiring missing CSP hashes.
- Homepage navigation actions are mapped.
- Resize/crop preset `change` actions are delegated correctly.
- Obsolete homepage-only PDF.js/split/bootstrap modules removed.
- Manifest and deployment documentation identify release 23.2.0.

## Deployment requirements
The Cloudflare D1 database ID and production secrets remain environment-specific and are intentionally not embedded in the release archive. `scripts/prepare-deploy.mjs` provisions a fresh D1 database when the placeholder is present.

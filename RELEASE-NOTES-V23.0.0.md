
> V23.1 UI polish is shipped in `UI-RELEASE-V23.1.md`. The V23.0 security/functionality baseline is retained.
# DOXFRAME 23.0.0 — Release Notes

## Implemented
- Added Image Compressor with 20/50/100/200/500 KB and custom target-size modes.
- Added Image Converter with JPG/PNG/WebP batch conversion and ZIP export.
- Added Passport Photo Maker and Signature Resizer workflows.
- Bulk Image Resize now produces a single ZIP download.
- PDF to JPG now produces a single ZIP download for multi-page exports.
- PDF compression now has High Quality, Balanced and Smallest modes; Balanced/Smallest use local rasterization for stronger image-heavy compression and clearly warn that text may be flattened.
- Removed duplicate eager data-action listeners from accessibility JS; delegated action handling is now the single action path.
- Added new tools to homepage discovery and sitemap.
- Added target-size image compression and clearer privacy/format limitations.
- Added automated deployment preparation script for creating and wiring a fresh D1 database.
- Added syntax-check command.

## Important deployment note
A D1 database is account-specific. The package cannot safely contain a real database ID without access to the deployment account. Run:

```bash
npm install
npm run prepare:deploy
npx wrangler d1 migrations apply doxframe-db --remote
npm run check
npm run deploy
```

Configure production secrets (`AUTH_PEPPER`, `RESEND_API_KEY`, `FROM_EMAIL`) and any optional Turnstile/Razorpay/MFA secrets before launch.

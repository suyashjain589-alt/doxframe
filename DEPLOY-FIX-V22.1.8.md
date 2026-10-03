> HISTORICAL DOCUMENT — retained for audit/change history. Do not use this file as current deployment instructions. Current release: V22.1.14.

# DOXFRAME V22.1.8 Deployment Fix

- Fixed the over-2000-character `public/_headers` CSP line.
- Moved executable inline JavaScript into same-origin files under `public/assets/inline/`.
- JSON-LD structured-data scripts remain inline.
- Removed CSP script hashes from `public/_headers`; no `unsafe-inline` was added to `script-src`.
- Bumped package version to 22.1.8.

## Historical source notes — retained for audit history

This release supersedes the previous V22.1.x package and includes the P0/P1/P2 security and UX fixes documented in `SECURITY-HARDENED-AUDIT.md`.

# DOXFRAME V22.1.1 — SOURCE NOTES

This release was assembled from the supplied DOXFRAME production package and the supplied SLIKAART security-hardened package.

The DOXFRAME production architecture remains the base. Selected SLIKAART PDF-workspace UX patterns were retained where they improve editing and page-management workflows without introducing server-side source-file storage.

Legacy URL aliases are preserved through redirects rather than duplicate HTML documents. Historical version references are retained only in migration/source lineage where they are useful for maintenance.

Brand: DOXFRAME
Logo source: user-supplied second (bottom-right) logo variant.


## DOXFRAME rebrand
- Public brand changed from WINGFILE to DOXFRAME.
- Historical note: an older WINGFILE-era D1 binding was once retained. This is no longer current. The fresh DOXFRAME release uses a new D1 database named `doxframe-db`.
- No domain change was made because no new domain was specified in the request.
- CSP inline-script hashes were regenerated after the branding change.

## V23.2.8 UI/Brand Refresh
- New DOXFRAME geometric logo, favicon and social assets.
- New clean light blue/indigo UI system and consistent footer across public pages.

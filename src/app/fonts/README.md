# Asset sources

## Geist variable font

Official source: https://github.com/vercel/geist-font/tree/10dc7658f13c38a474cde201bb09a4617267545b
File: fonts/Geist/webfonts/Geist[wght].woff2, copied unmodified as geist-variable.woff2 (69,760 bytes).
License: SIL Open Font License 1.1, included as OFL.txt.
Retrieved 2026-10-10. Self-hosted through next/font/local; builds and browsers do not fetch a third-party font service.
## Noto Sans Sinhala and Noto Sans Tamil

Retrieved 2026-10-10 from the official Google Fonts CSS2 service as variable-weight (100–900) script-only WOFF2 subsets, copied unmodified:

- noto-sans-sinhala-variable.woff2: 129,932 bytes, Google Fonts version v36.
- noto-sans-tamil-variable.woff2: 50,468 bytes, Google Fonts version v31.

Exact asset URLs, Unicode ranges and SHA-256 hashes are recorded in docs/design/stage-1-2026-10-10/font-provenance.json. SIL OFL 1.1 licenses are bundled as noto-sans-sinhala-OFL.txt and noto-sans-tamil-OFL.txt, obtained from the official google/fonts repository at revision 8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5.

Both use next/font/local, font-display swap, script Unicode ranges and preload=false. Browsers fetch local hashed assets only when those glyphs are present; no third-party font service is called at build or runtime. Explicit lang=si/ta spans use the corresponding script font; Geist remains English's first choice. Only English UI is offered: fonts establish typography readiness, not translations or reviewed multilingual acceptance. Existing system fallbacks remain available.

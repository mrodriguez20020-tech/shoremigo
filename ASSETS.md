# Asset & third-party licensing

The **source code** is MIT-licensed (see `LICENSE`). Non-code assets are listed here with their basis for use. Nothing in this repo is a stock photograph or a commercial music track.

| Asset | Location | Source | License / basis | Status |
|---|---|---|---|---|
| Migo character artwork (8 poses) | `public/migo/*.webp` | Sliced from the team-supplied sheet "Migo's Eight Cheerful Sticker Poses.png" via `scripts/slice-migo.mjs` | **Owned by the ShoreMigo team. NOT covered by the MIT license.** All rights reserved unless the team states otherwise. | ⚠️ **Team must confirm** how the artwork was created. If it was AI-generated, check that tool's terms for commercial use, and note that copyright protection for purely AI-generated images may be limited in some jurisdictions. Record the creator/tool here before submission. |
| Environment scenes (sky, sea, sun, islands, ship, palms) | `src/components/scene/SceneBackdrop.tsx` | Original vector code written for this project | MIT (part of the code) | ✅ |
| Excursion postcard art, compass mark | `src/components/excursion/ExcursionArt.tsx`, `src/components/brand/Wordmark.tsx` | Original vector code | MIT | ✅ |
| Sound (ambience, motif, Migo voice blips) | `src/components/audio/engine.ts` | Synthesized at runtime with the Web Audio API; no recordings or samples | MIT | ✅ |
| Fonts: Fraunces, Manrope | loaded via `next/font/google`, self-hosted at build | Google Fonts | SIL Open Font License 1.1 | ✅ |
| Photographs | none | — | — | ✅ none used |

## Third-party software (production dependency tree, audited 2026-11-10)

Installed production packages are under permissive licenses: MIT (majority), Apache-2.0 (`sharp`, `@swc/helpers`, `detect-libc`), ISC (`picocolors`, `semver`), BSD-3-Clause (`source-map-js`), 0BSD (`tslib`), Unlicense/public domain (`postgres`, the Postgres driver), and CC-BY-4.0 for data (`caniuse-lite`, attribution via its package). `@img/sharp-*` platform binaries bundle libvips under LGPL-3.0-or-later. They are installed by npm at build time and **not** redistributed in this repository.

The PayPal JS SDK is loaded at runtime from `paypal.com` under PayPal's developer terms. Gemini is called server-side under Google's API terms.

## Names and marks

"PayPal", "Gemini" and "Bryntum" are trademarks of their owners and are used only to describe integrations. Port names (Cozumel, Roatán, Grand Cayman, Ocho Rios) are real places. The ship *Aurora Tide*, the operator "Tidewalk Tours", and all guides, vehicles and prices are fictional demo data.

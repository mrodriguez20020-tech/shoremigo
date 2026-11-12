# Asset & third-party licensing

The **source code** is MIT-licensed (see `LICENSE`). Non-code assets are listed here with their basis for use. Photographs added for the Cinematic Luxury redesign are licensed under the Unsplash License and are explicitly illustrative. No commercial music tracks are used.

| Asset | Location | Source | License / basis | Status |
|---|---|---|---|---|
| Migo character artwork (8 poses) | `public/migo/*.webp` | Sliced from the team-supplied sheet "Migo's Eight Cheerful Sticker Poses.png" via `scripts/slice-migo.mjs` | **Created by the ShoreMigo team with an AI image-generation tool**; the team confirms that tool's terms permit commercial use. **NOT covered by the MIT license**; all rights reserved by the team to the extent the law allows (copyright protection for AI-generated images may be limited in some jurisdictions). No third-party character was copied. | ✅ Team-confirmed 2026-11-11 |
| Environment scenes (sky, sea, sun, islands, ship, palms) | `src/components/scene/SceneBackdrop.tsx` | Original vector code written for this project | MIT (part of the code) | ✅ |
| Excursion postcard art, compass mark | `src/components/excursion/ExcursionArt.tsx`, `src/components/brand/Wordmark.tsx` | Original vector code | MIT | ✅ |
| Sound (ambience, motif, Migo voice blips) | `src/components/audio/engine.ts` | Synthesized at runtime with the Web Audio API; no recordings or samples | MIT | ✅ |
| Fonts: Fraunces, Manrope | `src/app/fonts/`, loaded with `next/font/local` | [Google Fonts Fraunces](https://github.com/google/fonts/tree/main/ofl/fraunces), [Manrope](https://github.com/google/fonts/tree/main/ofl/manrope) | SIL Open Font License 1.1; license text bundled alongside font files | ✅ |
| Shoreline photograph | `public/images/caribbean-shore.webp` | [Unsplash source photo 1507525428034-b723cf961d3e](https://images.unsplash.com/photo-1507525428034-b723cf961d3e) | [Unsplash License](https://unsplash.com/license): download, copy, modify and use commercially; not relicensed as MIT | Illustrative tropical atmosphere; no location claim |
| Sunset photograph | `public/images/golden-ocean.webp` | [Unsplash source photo 1475924156734-496f6cac6ec1](https://images.unsplash.com/photo-1475924156734-496f6cac6ec1) | Unsplash License, as above | Illustrative; not Ocho Rios or a view from the listed tour |
| Restaurant photograph | `public/images/dining.webp` | [Unsplash source photo 1517248135467-4c7edcad34c4](https://images.unsplash.com/photo-1517248135467-4c7edcad34c4) | Unsplash License, as above | Illustrative; not a listed venue |
| Cruise harbor photograph | `public/images/ship.webp` | [Unsplash source photo 1548574505-5e239809ee19](https://images.unsplash.com/photo-1548574505-5e239809ee19) | Unsplash License, as above | Illustrative; does not depict the fictional Aurora Tide |

Photos are stored locally as optimized WebP files. They are atmospheric editorial images, not destination, inventory, vessel, or venue evidence. Adjacent captions disclose this in the welcome, hero, discovery tiles, and sunset section. They are not included under the source-code MIT license. No third-party photo is used to redraw or alter Migo.

## Phase 1.5 fictional environment assets

| Asset | Location | Source / rights basis | Disclosure |
|---|---|---|---|
| Fictional island/ocean plate | `public/cinematic/island-ocean.webp` | Created for this task using OpenAI image generation, 2026-11-11. User-generated output under OpenAI terms, including commercial use; not part of the source-code MIT license. | Fictional, Caribbean-inspired setting; no actual destination identity claimed |
| Aurora Tide concept render | `public/cinematic/aurora-tide.webp` | Original fictional vessel generated for this task using OpenAI image generation with the ocean plate as lighting/camera reference. Same rights basis as above. | Fictional vessel; 2D concept rendering, not a real cruise ship photo, live 3D model or accurate deck plan |
| Wake, contact shadows, scene grading | `OceanScene.tsx`, `globals.css`, `SpriteMigo.tsx` | Original code, MIT | Composited presentation, not water physics |
| Deck/cabin/sand contacts and landing | `src/components/audio/engine.ts` | Original short Web Audio noise synthesis; no recording, loop, sample or external effect | Opt-in only; synchronized to rendered contacts/landing |
| Browser evidence | `docs/phase15/` | Captured locally from this application with Playwright; contains the authorized assets listed here | Actual browser recording; audio begins only after recorded explicit sound opt-in |

[Asset direction and limitations](public/cinematic/README.md). The real cruise-harbor stock photograph remains archived in the repository but is no longer used for the Ships & Rooms discovery card. No real ship is presented as Aurora Tide. Migo's eight approved originals are unchanged; no generated replacement mascot or facial/limb layers were introduced. Full articulated locomotion remains asset-limited; see [Migo asset handoff](docs/MIGO_ASSET_PLAN.md).

## Third-party software (production dependency tree, audited 2026-11-10)

Installed production packages are under permissive licenses: MIT (majority), Apache-2.0 (`sharp`, `@swc/helpers`, `detect-libc`), ISC (`picocolors`, `semver`), BSD-3-Clause (`source-map-js`), 0BSD (`tslib`), Unlicense/public domain (`postgres`, the Postgres driver), and CC-BY-4.0 for data (`caniuse-lite`, attribution via its package). `@img/sharp-*` platform binaries bundle libvips under LGPL-3.0-or-later. They are installed by npm at build time and **not** redistributed in this repository.

The PayPal JS SDK is loaded at runtime from `paypal.com` under PayPal's developer terms. Gemini is called server-side under Google's API terms.

## Names and marks

"PayPal", "Gemini" and "Bryntum" are trademarks of their owners and are used only to describe integrations. Port names (Cozumel, Roatán, Grand Cayman, Ocho Rios) are real places. The ship *Aurora Tide*, the operator "Tidewalk Tours", and all guides, vehicles and prices are fictional demo data.

## WP-02 Aurora Tide design-control assets (proposal, 2026-11-12)

| Asset | Location | Source / rights basis | Disclosure |
|---|---|---|---|
| Parametric vessel contract | `design/aurora-tide/vessel.json` | Authored for ShoreMigo from the team-created A-02 concept (`public/cinematic/aurora-tide.webp`). Design asset, not covered by the MIT code licence. | Fictional vessel; proposed dimensions/decks awaiting owner approval; not an engineering or classification document |
| Elevations, bow/stern, plan, Deck 7 arrangement, three-quarter massing | `design/aurora-tide/sheets/*.svg` | Generated by `design/aurora-tide/generate.mjs` (repository source code) from `vessel.json`; same rights basis as A-02. No third-party models, textures or real ship data. | Design-control drawings, not renders; unseen sides marked as proposals |
| Massing model | `design/aurora-tide/model/aurora-tide-massing.glb` | Generated by the same script; same rights basis. | Proportion/identity massing, not the production model |
| Cabin 7214 floor plan | `design/aurora-tide/sheets/08-cabin-7214-plan.svg` | Generated by `generate.mjs` from `vessel.json` (`cabin7214`); same rights basis as A-02 | Fictional cabin plan inside the proposed envelope; not a render or walkthrough |
| Concept-overlay comparison | `design/aurora-tide/review/concept-overlay.webp` (+ `.json`) | Produced by `design/aurora-tide/overlay.mjs` over the A-02 concept; same rights basis as A-02 | Measured silhouette comparison for design review, not a render |

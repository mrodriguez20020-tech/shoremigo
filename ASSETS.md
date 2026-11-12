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
| Cruise harbor photograph | [archived stock harbor photo](https://raw.githubusercontent.com/mrodriguez20020-tech/shoremigo/c64ace134e228403c11ece9e152a8a30faa66350/public/images/ship.webp) | [Unsplash source photo 1548574505-5e239809ee19](https://images.unsplash.com/photo-1548574505-5e239809ee19) | Unsplash License, as above | Illustrative; does not depict the fictional Aurora Tide |

Photos are stored locally as optimized WebP files. They are atmospheric editorial images, not destination, inventory, vessel, or venue evidence. Adjacent captions disclose this in the welcome, hero, discovery tiles, and sunset section. They are not included under the source-code MIT license. No third-party photo is used to redraw or alter Migo.

## Phase 1.5 fictional environment assets

| Asset | Location | Source / rights basis | Disclosure |
|---|---|---|---|
| Fictional island/ocean plate | `public/cinematic/island-ocean.webp` | Created for this task using OpenAI image generation, 2026-11-11. User-generated output under OpenAI terms, including commercial use; not part of the source-code MIT license. | Fictional, Caribbean-inspired setting; no actual destination identity claimed |
| Aurora Tide concept render | `public/cinematic/aurora-tide.webp` | Original fictional vessel generated for this task using OpenAI image generation with the ocean plate as lighting/camera reference. Same rights basis as above. | Fictional vessel; 2D concept rendering, not a real cruise ship photo, live 3D model or accurate deck plan |
| Phase 1.5 wake/grade (removed from current environment), Migo contact shadows | Historical `OceanScene.tsx`/CSS; current `SpriteMigo.tsx` | Original code, MIT | The former ocean approximations are rejected; no physical water is claimed |
| Deck/cabin/sand contacts and landing | `src/components/audio/engine.ts` | Original short Web Audio noise synthesis; no recording, loop, sample or external effect | Opt-in only; synchronized to rendered contacts/landing |
| Browser evidence | `docs/phase15/` | Captured locally from this application with Playwright; contains the authorized assets listed here | Actual browser recording; audio begins only after recorded explicit sound opt-in |

[Asset direction and limitations](public/cinematic/README.md). The real cruise-harbor stock photograph remains archived in the repository but is no longer used for the Ships & Rooms discovery card. No real ship is presented as Aurora Tide. Migo's eight approved originals are unchanged; no generated replacement mascot or facial/limb layers were introduced. Full articulated locomotion remains asset-limited; see [Migo asset handoff](docs/MIGO_ASSET_PLAN.md).

## Third-party software (production dependency tree, audited 2026-11-10)

Installed production packages are under permissive licenses: MIT (majority), Apache-2.0 (`sharp`, `@swc/helpers`, `detect-libc`), ISC (`picocolors`, `semver`), BSD-3-Clause (`source-map-js`), 0BSD (`tslib`), Unlicense/public domain (`postgres`, the Postgres driver), and CC-BY-4.0 for data (`caniuse-lite`, attribution via its package). `@img/sharp-*` platform binaries bundle libvips under LGPL-3.0-or-later. They are installed by npm at build time and **not** redistributed in this repository.

The PayPal JS SDK is loaded at runtime from `paypal.com` under PayPal's developer terms. Gemini is called server-side under Google's API terms.

## Names and marks

"PayPal", "Gemini" and "Bryntum" are trademarks of their owners and are used only to describe integrations. Port names (Cozumel, Roatán, Grand Cayman, Ocho Rios) are real places. The ship *Aurora Tide*, the operator "Tidewalk Tours", and all guides, vehicles and prices are fictional demo data.

## Signature interim delivery

| Asset | Location | Source / rights basis | Disclosure |
|---|---|---|---|
| Integrated Aurora Tide / ocean concept still | `public/cinematic/signature-still.webp` | Created for this task using OpenAI image generation on 2026-11-11, using the approved original vessel and ocean concepts as references; generated output under applicable OpenAI terms, including commercial use. Excluded from MIT code license. | Fictional, AI-generated **static** atmosphere; not footage, not a real destination/ship photograph, not an approved 3D model or a verified unseen-side design |
| Native-media engineering patterns | Generated locally by FFmpeg from `tests/browser/signature.spec.ts`, ignored `work/signature/fixtures/` | Procedural test-source patterns and text; no external footage or audio | Clearly marked test data only; never public cinematic media or visual acceptance evidence |
| Interim review screenshots/recording | `docs/signature/evidence/` | Actual headed Chromium capture of this application and the authorized assets above | Still fallback only; muted recording; does not establish moving-water/sunset quality |

No new motion footage, third-party 3D model, stock ocean film, music or external audio sample was licensed or added. The rejected local Blender proof is not a production asset. The public film manifest remains pending; no fabricated production geometry/camera identifiers or video rights are supplied. [Production source/rights requirements](docs/signature/ASSET_PRODUCTION_SPEC.md). Original Migo files are unchanged.

## WP-01 review remediation asset retirement

The unused harbor stock image was removed from the current public bundle after a source-reference check. Its original Unsplash attribution/license above is retained, and its [immutable pre-remediation copy](https://raw.githubusercontent.com/mrodriguez20020-tech/shoremigo/c64ace134e228403c11ece9e152a8a30faa66350/public/images/ship.webp) remains accessible. Original Migo and approved vessel/environment reference assets are unchanged. Existing review recordings/screenshots are retained; new compact captures are published as review-only GitHub release assets under [the evidence policy](docs/EVIDENCE_POLICY.md), not added repeatedly to Git history. No paid storage is introduced.

## WP-04 culinary guide photographs · 2026-11-12

These are editorial photographs of dishes, not a partner venue, a tour, or a sample-menu serving. Source/master URLs, source hashes, delivery hashes and transformations are in [`public/culinary/credits.json`](public/culinary/credits.json). Original downloaded masters are retained in ignored review work; the publicly licensed source URLs remain the master references. WebP derivatives retain the image license, separate from code MIT.

| ID / derivatives | Author | Source | License | Changes / subject verification |
|---|---|---|---|---|
| M-04-doubles · `doubles-{640,1200,2400}.webp` | Grueslayer @Wikipedia | [File:FOOD Doubles 2.jpg](https://commons.wikimedia.org/wiki/File:FOOD_Doubles_2.jpg) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | Resize and WebP conversion; photograph visually checked against source description. |
| M-04-jerk · `jerk-{640,1200,2400}.webp` | naotakem | [File:Jerk Chicken Plate.jpg](https://commons.wikimedia.org/wiki/File:Jerk_Chicken_Plate.jpg) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | Resize and WebP conversion; photograph visually checked against source description. |
| M-04-cochinita · `cochinita-{640,1200,2400}.webp` | Petrvs III | [File:Cochinita Pibil Casera, México.jpg](https://commons.wikimedia.org/wiki/File:Cochinita_Pibil_Casera,_M%C3%A9xico.jpg) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | Resize and WebP conversion; photograph visually checked against source description. |

Credits and license links are visible below the guide and in the expanded view. No ingredient/allergen assurance is inferred from photographs. The remaining dishes, sample drinks and desserts use the original MIT vector DishArt and are labeled Original illustration; photographs of differently prepared dishes are deliberately not assigned to sample-menu items. Photographs are licensed, not team-created or generated.
## WP-02 Aurora Tide design-control assets (proposal, 2026-11-12)

| Asset | Location | Source / rights basis | Disclosure |
|---|---|---|---|
| Parametric vessel contract | `design/aurora-tide/vessel.json` | Authored for ShoreMigo from the team-created A-02 concept (`public/cinematic/aurora-tide.webp`). Design asset, not covered by the MIT code licence. | Fictional vessel; proposed dimensions/decks awaiting owner approval; not an engineering or classification document |
| Elevations, bow/stern, plan, Deck 7 arrangement, three-quarter massing (sheets 01–07) | `design/aurora-tide/sheets/*.svg` | Generated by `design/aurora-tide/generate.mjs` (repository source code) from `vessel.json`; same rights basis as A-02. No third-party models, textures or real ship data. | Design-control drawings, not renders; unseen sides marked as proposals |
| Massing model | `design/aurora-tide/model/aurora-tide-massing.glb` | Generated by the same script; same rights basis. | Proportion/identity massing (one closed mesh per solid; every sheet and the overlay derive from it), not the production model |
| Cabin 7214 floor plan | `design/aurora-tide/sheets/08-cabin-7214-plan.svg` | Generated by `generate.mjs` from `vessel.json` (`cabin7214`); same rights basis as A-02 | Fictional cabin plan inside the proposed envelope; not a render or walkthrough |
| Concept-overlay comparison | `design/aurora-tide/review/concept-overlay.webp` (+ `.json`) | Produced by `design/aurora-tide/overlay.mjs` over the A-02 concept; same rights basis as A-02 | Measured, seeded (reproducible) silhouette comparison for design review, not a render |
| Deck 4 arrangement + entertainment lounge | `design/aurora-tide/sheets/09-deck4-lounge.svg` | Generated by `generate.mjs` from `vessel.json` (`entertainmentLounge`); same rights basis as A-02 | Fictional schematic; lounge capacity is a design target, not certified occupancy; acoustic/fire/escape not engineered |
| Accommodation validation | `design/aurora-tide/sheets/10-accommodation-validation.svg` | Generated by `generate.mjs` from `vessel.json`; same rights basis as A-02 | Fictional schematic; full-footprint fit of all 104 slots; not an engineering or classification document |
| Verification report and review reconciliation | `design/aurora-tide/review/verify-report.json`, `design/aurora-tide/review/CODEX-REVIEW-RECONCILIATION.md` | Produced by `verify.mjs` (repository source) / authored for WP-02 | Internal-consistency evidence for a fictional design; not certification |

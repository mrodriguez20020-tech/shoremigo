# Asset registry and production dependencies

This is the readiness/integration index. **[ASSETS.md](../ASSETS.md) remains the licensing authority**; do not replace or duplicate its rights terms. Existing media hashes are recorded in [signature/evidence/asset-hashes.json](signature/evidence/asset-hashes.json). Missing entries below have no invented files, hashes, licenses or production approval.

## Available material

| ID | Subject/source | Current format / integration | Readiness and limitation |
|---|---|---|---|
| A-01 | Fictional Caribbean-inspired ocean/island concept, `public/cinematic/island-ocean.webp` | Original generated WebP; environment identity reference | Available concept only; static water, no simulation/source film |
| A-02 | Approved Aurora Tide appearance, `public/cinematic/aurora-tide.webp` | Generated transparent WebP; exterior modeling authority and existing discovery card | Available single view; no definitive dimensions/unseen geometry/deck plan |
| A-03 | Integrated fictional vessel/ocean interim still, `public/cinematic/signature-still.webp` | Generated WebP; current `CinematicBackdrop` fallback, no scene transforms | Temporary still, not film, not new geometry authority, not matched sunset |
| A-04 | Original Migo eight poses, `public/migo/*.webp` | 440 × 440 transparent WebP; existing event-driven renderer/greeting | Approved artwork unchanged; only two flat walk poses, no articulation/eye/limb source |
| A-05 | Shoreline, sunset and restaurant stock atmosphere (harbor retired from runtime), `public/images/` | Local optimized WebP, sources/license in ASSETS | Illustrative only; harbor is not Aurora Tide, restaurant is not a verified venue; not spatial/cinematic source |
| A-06 | Fraunces/Manrope, `src/app/fonts/` | Local variable font files with OFL notices | Available, licensed; existing typography baseline |
| A-07 | Synthesized app ambience/Migo/contact audio | Original Web Audio code under existing license; opt-in application output | Available, no external music/sample; keep muted by default and independent from films |
| A-08 | Existing deck/cabin/menu demo diagrams/content | Original vector UI and fictional data in ship/dining modules | Functional demo; not definitive architecture, spatial cabin, food photography or real partner data |

## Missing production deliveries

For all visual entries: the owner must assign a production source owner and approve final appearance. Code implementation ownership alone does not supply these assets. Source rights must permit commercial web display, editing and derivative renders, and must be recorded before use. No paid generation or new third-party license is authorized by this index.

### M-01 — WP-01 matched signature films (BLOCKED)

- **Subject:** the approved fictional Aurora Tide in a living Caribbean-inspired ocean, integrated bow/stern wake, changing hull/water reflections, island depth and atmospheric sky.
- **Geometry/source:** one approved canonical vessel/environment/water/wake scene, editable source and simulation caches/seeds; source/frame/color/rights BOM, geometry and complete camera-rig hashes. Depends on M-02; no transparent ship over independent footage.
- **Camera:** frozen matched elevated port-aft wide and purpose-framed portrait cameras; negative space and UI-safe masks; identical geometry/camera/phase within each day/sunset pair.
- **Lighting:** physically coordinated daylight and golden hour, including sea, ship, sky and reflections; matching Migo/compass light metadata. No orange grade substitute.
- **Animation:** preferred 8 s / 192 frames / 24 fps; supported 6–16 s at 24/30 fps; credible small waves and restrained vessel movement, coherent wake, clean continuous loop, frame correspondence across lights.
- **Delivery:** silent H.264 MP4 + optional identical VP9, frame-zero WebP posters; wide 1920×1080 preferred (minimum 1280×720, ≤6 MB per clip), portrait 900×1440 or 720×1280 (≤2.5 MB per clip). Proper HTTP byte-range serving is required for native seeking; zero audio streams.
- **Rights/integration:** documented licensed/generated source rights and fictional disclosures; `public/cinematic/film/manifest.json` plus `CinematicBackdrop`; still/reduced-motion/Save-Data fallbacks. Exact [production spec](signature/ASSET_PRODUCTION_SPEC.md). Public manifest stays pending; final genuine moving-water/sunset browser proof is missing.

### M-02 — WP-02 canonical vessel/decks (Claude-owned; production assets BLOCKED)

- **Owner/dependency:** Claude owns WP-02; Codex independently reviews PR #3. A provisional spec, SVG sheets, cabin plan and massing GLB exist at `414b627`, with REQUEST CHANGES in [the independent review](https://github.com/mrodriguez20020-tech/shoremigo/pull/3#pullrequestreview-5869346197); these do not supply the production asset. Claude later submitted4a3bd65; its reconciliation and tapered-balcony proposal await independent review/owner decision. The current homepage/explorer architecture/facts mismatch is not resolved by the concept still. Codex preserves this dependency and does not invent a second canonical vessel.
- **Subject:** faithful pearl-white/navy/sea-glass Aurora Tide, glazing, tiered observation decks, exterior amenities and approved deck arrangement; preserve A-02.
- **Geometry/source:** editable production scene and interchange USD/GLB, reusable topology/material IDs, textures and source provenance; approved dimensions/elevations/unseen views/deck plan required, not derivable reliably from one concept.
- **Camera/light/motion:** approved port-aft hero plus front/rear/side/elevated review views; consistent scale; neutral/day/golden material studies, turntable and water/wake lookdev, same geometry identity in every view.
- **Resolution/optimization:** review sheets ≥2048 px, source/master quality sufficient for M-01; future web LOD/texture budgets must be measured after runtime choice, not invented here. Do not ship large source/master files as web assets.
- **Rights/integration:** source/model/texture commercial derivative rights and hashes; approved exports feed M-01 and later ship/deck/cabin modules without competing hero implementation. [WP02_BRIEF.md](WP02_BRIEF.md).

### M-03 — WP-03 spatial Cabin 7214 (SOURCE MISSING; provisional plan under correction)

- **Subject:** connected bedroom, living area, bathroom and private balcony of Cabin 7214 on Deck 7 of the same fictional vessel. WP-02 supplies a provisional envelope/plan; entry circulation, net-area/partition conventions and cross-view geometry require correction before spatial implementation.
- **Geometry/source:** owner-approved coherent floor plan, dimensions, doors, circulation, materials and spatial source scene (or matched panoramic positions with explicit spatial map). Existing four vector views are insufficient.
- **Camera/light/motion:** human-scale approved traversal/hotspots and accessible alternative views; consistent exterior/balcony ocean light, continuous transitions between physically connected spaces. Detailed control/storyboard reference missing.
- **Resolution/optimization:** source masters and preview frames ≥2048 px; propose measured web texture/LOD/panorama budgets against the approved runtime and 320/390 px UI before production export. No unsupported universal budget is claimed.
- **Rights/integration:** commercial interior/material/environment rights, fictional disclosure; isolated ship cabin renderer, keyboard/touch/reduced-motion controls, no cabin sales/inventory claims. Depends on M-02.

### M-04 — WP-04 culinary imagery (MISSING)

- **Subject:** accurately identified dishes, venue atmosphere, alcoholic/nonalcoholic drinks and desserts consistent with approved sample/partner content.
- **Geometry/source:** photography/generated-image masters and subject/focal metadata; no 3D source required for ordinary image expansion. Verified partner data is required before real venue claims.
- **Camera/light/motion:** approved editorial crops and coherent food lighting, thumbnail/full-image match; expansion interaction/storyboard still missing. Do not infer a real restaurant from atmospheric stock.
- **Resolution/optimization:** source long edge ≥2400 px for expansion review, responsive AVIF/WebP derivatives and thumbnails; image/total-page budgets selected from measured gallery behavior before enabling full-resolution loads.
- **Rights/integration:** commercial display/crop/derivative rights, source/subject review and alt/demo labels; `/taste` and dining components, menus/drinks/desserts remain usable without media. No invented allergen or partnership claims.

### M-05 — WP-05 reef/entry scene (MISSING)

- **Subject/source:** coherent ocean surface, crossing water boundary and underwater reef/sea life; editable scene or matched continuous footage with source/rights, depth/refraction/light continuity. No independent unrelated above/below plates.
- **Camera/light/motion:** approved above-to-below camera path, plausible water contact/refraction/bubbles/caustics and restrained marine movement; exact storyboard/environment identity missing.
- **Resolution/optimization:** 1080p wide and purpose-framed portrait production masters plus optimized silent web clips/stills; final duration, loops and budgets require the approved transition/runtime and measured decode behavior.
- **Rights/integration:** commercial environment/sea-life media rights and truthful geographic labels; isolated reef entry renderer with keyboard/reduced-motion/navigation fallback, preserving actual excursion inventory.

### M-06 — WP-06 forest/zipline/nature (MISSING)

- **Subject/source:** coherent rainforest canopy and zipline environment, plus separately scoped waterfall/nature/relax media; editable environment/camera source or continuous licensed footage with matched views/depth.
- **Camera/light/motion:** owner-approved canopy-rise/zipline track with consistent lighting, parallax and depth; graceful camera behavior without forced scroll. Detailed reference and location/available-activity identity missing.
- **Resolution/optimization:** 1080p wide and portrait masters with still/reduced-motion exports; duration/crop/byte/decode budgets selected and measured against the approved transition/runtime.
- **Rights/integration:** commercial source/environment/footage rights; verified identity when a real place is named, illustrative otherwise; isolated activity renderer and working excursion/relax navigation.

### M-07 — WP-07 original Migo source (BLOCKED)

- **Subject/source:** exactly the approved character; separated original art/rig with hidden joint artwork, pivots and deformation constraints, or registered authored frames on the existing transparent 440×440 canvas. No replacement mascot.
- **Camera/light/motion:** original style and silhouette across authored turns, walk/anticipation/stop/settle, greeting, expressions and compass/crest/strap follow-through. Sole coordinates, planted intervals, root displacement, surface and hop/landing/interruption markers required.
- **Resolution/optimization:** maintain source-quality masters; optimized transparent frames/atlas or measured runtime rig export, avoid padding/crop drift. Do not claim the current two poses form a rig.
- **Rights/integration:** team source/derivative animation rights; keep existing event bus/machine, verified-success gates, contact/audio boundaries, mobile/reduced-motion controls. Exact [MIGO_ASSET_PLAN.md](MIGO_ASSET_PLAN.md).

### M-08 / M-09 — future planner/departure specifications (MISSING REFERENCES)

These are product/domain inputs, not visual assets. M-08 requires the approved multi-item planner UX, transfer/conflict/price rules and item-to-booking semantics. M-09 requires departure IDs, capacity/hold/expiry/time-zone/concurrency/payment/rescue rules and migration/rollback design. Required format: versioned approved design/API/data specification with fixtures and acceptance scenarios. No camera/light/animation or asset license applies until new media is proposed. Integrate only through separately authorized WP-08/09; roadmap entries do not authorize backend changes.

## Evidence and exclusions

`docs/phase15/` is historical rejected visual evidence. `docs/signature/evidence/` is the current **interim still** browser capture, not moving-water acceptance. FFmpeg patterns generated under ignored `work/signature/fixtures/` are QA-only; the rejected Blender scene is not an approved source model. No production film/model rights or geometry identity is fabricated. Final approval and real asset hashes must be added to this registry when actual delivery exists.

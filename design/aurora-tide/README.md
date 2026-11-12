# WP-02 · Canonical Aurora Tide: architecture, design control and production strategy

**Owner:** Claude (implementation) · **Independent reviewer:** Codex · **Appearance approval:** project owner
**Branch:** `feat/wp02-aurora-tide` from `design/cinematic-luxury` @ `000a837adfa8bf3ed39f05be61e09a4bc3f6df3e`. Not based on unmerged WP-01 (PR #2); its shared documents were read by exact ref `c64ace1` and are not imported.
**Status:** spec `0.3.0-provisional`. Owner decisions D-W02-1…10 recorded. **Codex independent review not yet received.** Final appearance approval follows the review. This is massing and design control only: **not** a production model, **not** a photoreal render, **WP-02 not complete**.

## 1. Owner decisions recorded (2026-11-12)
| ID | Decision | Status |
|---|---|---|
| D-W02-1 | Cabin 9214 → **Cabin 7214**, Premium Balcony Stateroom, Deck 7 port. No owner's-suite conversion, no deck re-basing. | Approved |
| D-W02-2 | 158 × 23 × 5.4 m, nine decks, four stepped aft terraces, three panoramic bands, pearl-white / deep navy / restrained sea-glass. Fictional values. | Provisionally approved |
| D-W02-3 | **~208 guests, 104 staterooms, nine decks** (derived), replacing 1,900 guests / 14 decks. | Approved |
| D-W02-4 | Mirrored starboard, stepped stern + marina, Deck 8 forward bridge, funnel, Deck 9 sun deck, Deck 7 aft recreation. | Provisionally approved |
| D-W02-5 | Zero unapproved spending. Five gates before any production rendering. GLB is massing only. | Constraint |
| D-W02-6 | Offer **Oceanview** and **Premium Balcony** staterooms plus **Signature Cabin 7214**. **Interior staterooms removed.** **Tidekeeper Suite: future concept only**, never shown as available until validated. 104 / ~208 preserved. | Approved |
| D-W02-7 | **Theatre and kids' splash zone removed.** **Boutique entertainment lounge** replaces the theatre, advertised only once located. The other amenities are retained. No unsupported amenities. | Approved; lounge location proposed (§4) |
| D-W02-8 | Cabin 7214 programme approved as the provisional interior foundation. 31.9 m² net / 9.0 m² balcony are the provisional basis, subject to independent verification. Clearances are fictional design targets, not certified claims. | Provisionally approved |
| D-W02-9 | ~90 % overlay agreement accepted. Stop optimising. Overlay seeded and reproducible. Spec identity and model identity kept separate. | Approved |
| D-W02-10 | Golden-hour card moves to the left safe area; the vessel stays right. WP-01 (Codex) implements on PR #2. Camera, ship and environment identical in daylight and sunset. | Approved direction |

Machine-readable: [`vessel.json`](vessel.json) → `decisions`, `accommodation.offering/removed/futureConcepts`, `amenityMap`, `entertainmentLounge`, `cabin7214.designTargets`.

## 2. Deliverables
| Deliverable | File |
|---|---|
| Canonical parametric contract (single source of truth) | [`vessel.json`](vessel.json) |
| Generator (zero deps; every view, the GLB and the identity hashes) | [`generate.mjs`](generate.mjs) |
| **Invariant checks (33)** | [`verify.mjs`](verify.mjs) |
| Port / starboard elevations; bow / stern | [`sheets/01`](sheets/01-port-elevation.svg), [`02`](sheets/02-starboard-elevation.svg), [`03`](sheets/03-bow.svg), [`04`](sheets/04-stern.svg) |
| Plan; Deck 7 arrangement (Cabin 7214) | [`sheets/05`](sheets/05-plan.svg), [`06`](sheets/06-deck7-arrangement.svg) |
| Three-quarter massing (A-02 framing family) | [`sheets/07`](sheets/07-three-quarter-massing.svg) |
| Cabin 7214 floor plan | [`sheets/08`](sheets/08-cabin-7214-plan.svg) |
| **Deck 4 arrangement + entertainment lounge** | [`sheets/09`](sheets/09-deck4-lounge.svg) |
| Concept overlay (measured, seeded) | [`review/concept-overlay.webp`](review/concept-overlay.webp), [`review/concept-overlay.json`](review/concept-overlay.json), tool [`overlay.mjs`](overlay.mjs) |
| Massing model (glTF 2.0) | [`model/aurora-tide-massing.glb`](model/aurora-tide-massing.glb) |
| Identity manifest | [`manifest.json`](manifest.json) |
| Ships & Rooms migration inventory + scoped plan | [`MIGRATION.md`](MIGRATION.md) |
| Production source/asset requirements + look-dev sample plan | [`PRODUCTION.md`](PRODUCTION.md) |

Regenerate and check: `node design/aurora-tide/generate.mjs && node design/aurora-tide/verify.mjs`. The tree must stay clean after regeneration.
Overlay: `WP02_FACES_OUT=work/faces.json node design/aurora-tide/generate.mjs && PLAYWRIGHT_CHROMIUM_PATH=<chrome> node design/aurora-tide/overlay.mjs work/faces.json`. This needs the repo's Playwright dev dependency. The seed defaults to `20261112`; override it with `WP02_OVERLAY_SEED`.

## 3. Identity (D-W02-9)
| Id | Hash of | Changes when |
|---|---|---|
| `specId` | `vessel.json` content | any spec edit (including decision prose) |
| `generatorId` | `generate.mjs` source, LF-normalised | any generator edit |
| `massingModelId` | generated massing geometry: every prism face, vertices rounded to 1 mm, with materials | **only when produced geometry changes**, including generator changes that leave `specId` alone |
| `cameraId` | review camera definition | camera edits |
| file hashes | each output byte-for-byte | any output change |

Example from this revision: spec edits and drawing-only fixes changed `specId` and `generatorId` while `massingModelId` stayed `5087c486…`. So the overlay measured on that geometry is still valid, and `verify.mjs` checks this. A future production model gets its own id, recorded against the `specId` it was built to. The approved pair is frozen at `1.0.0`.

## 4. Entertainment lounge (D-W02-7), proposed location
**Deck 4 aft**, between the glazed wall onto terrace T1 and the first oceanview stateroom ([sheet 09](sheets/09-deck4-lounge.svg)). This is exactly the space the deck 4 capacity rule already left free. It displaces **no staterooms**, so capacity stays 104 / ~208. It matches the A-02 observation of a glazed lowest aft terrace.
- x 9.0–22.95 m; 13.95 m long; 20.4–22.3 m wide; **300.8 m² gross**.
- Bar and back-of-house band (66.7 m²) along the forward bulkhead, also the acoustic buffer to the staterooms. Entry from the Deck 4 corridor on the centreline.
- Performance platform (12 m²) against the aft glazing, so performers have the sea behind them.
- Net seating 173.8 m², giving **≈96 seated** (≈46 % of guests). This is a fictional target at 1.8 m² per seated guest after 15 % circulation.
- **Not engineered or certified:** acoustic separation, fire and escape arrangements (second escape via T1 assumed) and occupancy.
- Drawing fix: the elevations' aft Deck 4 glazing now covers only the lounge (it previously ran over oceanview staterooms and above the Deck 5 floor).

Retained amenity locations (`amenityMap`):
- Deck 5: premium main dining aft (Compass Rose), Nightwatch Patisserie on the promenade, shore-excursion concierge desk in the atrium.
- Deck 6: lounge terrace T3 aft.
- Deck 7: pool and recreation terrace T4 aft.
- Deck 8: spa and fitness midship, observation lounge forward.
- Deck 9: sun deck.
- Deck 3: marina.

## 5. Concept overlay: measured fit
The overlay fits a perspective camera to the transparent A-02 silhouette and reports intersection-over-union, plus a map (red = in the concept but missing from the model; blue = model where the concept has nothing).

| Pass | Silhouette IoU | Corrections |
|---|---|---|
| Proposal (`0.1.0`) | 84.5 % | none |
| 1 | 89.1 % | aft tiers extended aft; forward ends shortened (open forecastle); funnel raised with swept casing base; radomes and mast moved aft; stem rake increased |
| 2 | 89.3 % | decks 5–7 forward ends −4 m; Deck 8 further aft; funnel 36.0 m; radome platform; mast x 108 m; stem 140 m |
| 3 | 89.9–90.2 % (unseeded) | bow sheer 18.7 → 16.5 m; radome platform modeled |
| **Current (seeded, reproducible)** | **89.86 %**, seed 20261112, two runs byte-identical | none; massing unchanged since pass 3 |

Fitted camera (recorded in the JSON): azimuth −37.85°, elevation 5.16°, distance 947.5 m, roll −3.12°, target (79, 0, 14) m.

Residuals, each under 2 % per length band:
- umbrellas, railings and planters (omitted by design);
- the funnel casing's sculpted swept form (boxy in massing);
- a small excess at the lower bow;
- radome and mast detailing.

These are production-detail or generated-image differences, not structural inconsistencies. Per D-W02-9, no further fitting.

## 6. Cabin 7214
The plan sits inside the approved envelope (4.6 m module, 7.2 m interior, 2.1 m balcony, 2.4 m clear ceiling). Partitions: cabin 0.10, corridor 0.12, bathroom 0.08 m. Layout:
- bathroom beside the entry (2.50 × 2.20 m) and a full-height wardrobe;
- king bed facing the sea, living area at the glazing;
- 4 × 1.15 m sliding glass panels onto a 9.0 m² balcony.

Figures:
- **33.1 m² gross, 31.9 m² net**;
- minimum clearance 0.79 m against a 0.75 m **fictional** target;
- hull fit: 9.42 m needed of 9.8 m available.

Six viewpoints (V1 entry … V6 balcony-in) are the only allowed spatial render positions. Materials are light oak, warm ivory, champagne hardware and sea-glass; lighting states are daylight, golden hour and evening.

## 7. Production route (zero spend), summary
Full requirements and the staged look-dev plan are in [`PRODUCTION.md`](PRODUCTION.md).
- **Local machine:** not viable for M-01 (i3-4005U, Intel HD, 7.9 GB RAM, 6.1 GB free disk). I did not attempt another full render here.
- **Recommended route:** Blender (GPL) + Poly Haven CC0, a team member as modeler from this contract, team GPU hardware, and SheepIt as fallback after a terms check. **No resource confirmed; the modeler is the critical blocker.**
- **Before committing to 768 frames:** a staged look-dev sample, L0 stills → L1 2 s water/wake clip → L2 one matched day/sunset 8 s pair, each with go/no-go criteria.
- The missing resource does not block application work: the Ships & Rooms migration ([`MIGRATION.md`](MIGRATION.md)) can use honestly labelled schematics.

## 8. Film framing (D-W02-10)
Accepted direction: at ≥1024 px the golden-hour "Featured excursion" card moves into the left-side safe area, and the vessel stays on the right (x ≈ 57–94 %). One frozen camera, ship and environment across daylight and sunset. **Implementation belongs to WP-01 (Codex) on PR #2.** WP-02 does not modify that branch. D-W02-5 gate 4 closes when PR #2 implements it and the golden-hour mask check passes.

## 9. Rights and provenance
`generate.mjs`, `overlay.mjs` and `verify.mjs` are repository source code. `vessel.json`, the sheets, the overlay image and the GLB are design assets derived from the team-created A-02 concept: not MIT-licensed, fictional vessel, no third-party models, textures or real ship data. All are recorded in `ASSETS.md`.

## 10. Codex independent review: handoff
Review the branch head (see PR #3), base `000a837`. Run `generate.mjs` then `verify.mjs`: the tree must stay clean and all checks pass. Then:
1. **Geometry vs A-02:** reproduce the seeded overlay (IoU 89.86 %), inspect the map, and flag any structural residual you consider a defect.
2. **Consistency and identity:** sheets, GLB (158 m) and manifest all come from `vessel.json`; check that `massingModelId` is stable under drawing-only changes.
3. **Capacity and Cabin 7214:** numbering, computed position, envelope arithmetic, clearances and hull fit.
4. **Entertainment lounge:** location, metrics and the claim that it displaces no staterooms (sheet 09).
5. **Unseen geometry (D-W02-4).**
6. **Migration plan:** completeness against current `main` (re-grep).
7. **Production plan:** estimates and look-dev stages.

Post findings on PR #3 with file/line, evidence and severity. Do not merge.

## 11. Next actions
1. Codex reviews PR #3; I correct confirmed defects here.
2. Owner final appearance approval of corrected sheets + overlay + lounge location → `vessel.json` `1.0.0`, freeze `specId` + `massingModelId`.
3. Codex implements the golden-hour card move on PR #2 (D-W02-10).
4. Then a separately scoped Ships & Rooms migration branch from `main` ([`MIGRATION.md`](MIGRATION.md) §3), with owner authorization.
5. In parallel, at zero cost: identify a modeler and hardware, then look-dev stage L0 ([`PRODUCTION.md`](PRODUCTION.md)).

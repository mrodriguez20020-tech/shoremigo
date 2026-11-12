# WP-02 · Canonical Aurora Tide: architecture, design control and production strategy

**Owner:** Claude (implementation) · **Independent reviewer:** Codex · **Appearance approval:** project owner
**Branch:** `feat/wp02-aurora-tide` from `design/cinematic-luxury` @ `000a837`. It does not include or modify WP-01 (PR #2).
**Status:** spec `0.4.0-provisional`. Codex REQUEST CHANGES on `414b627` has been reconciled; see [`review/CODEX-REVIEW-RECONCILIATION.md`](review/CODEX-REVIEW-RECONCILIATION.md). **Awaiting Codex re-review of the corrected SHA.**
This is massing and design control only: **not** a production model, **not** a photoreal render. Geometry is **not frozen**.

## 1. Owner decisions (2026-11-12), recorded in `vessel.json` → `decisions`
| ID | Decision | Status |
|---|---|---|
| D-W02-1 | Cabin 9214 becomes **Signature Cabin 7214**, a Premium Balcony Stateroom on Deck 7, port side | Approved |
| D-W02-2 | 158 × 23 × 5.4 m, nine decks, four aft terraces, three panoramic bands, pearl/navy/sea-glass | Provisional |
| D-W02-3 | **~208 guests / 104 staterooms / nine decks** (derived) | Approved |
| D-W02-4 | Mirrored starboard, stepped stern + marina, Deck 8 bridge, funnel, D9 open sun deck, D7 aft recreation | Provisional |
| D-W02-5 | Zero spending; five gates before any production rendering | Constraint |
| D-W02-6 | Oceanview + Premium Balcony + Cabin 7214. Interior removed. Tidekeeper Suite future-only. | Approved |
| D-W02-7 | Theatre and splash zone removed; boutique entertainment lounge (located, sheet 09) | Approved; location proposed |
| D-W02-8 | Cabin 7214 programme provisional; areas and clearances are fictional targets, not certified | Provisional |
| D-W02-9 | ~90 % overlay accepted; seeded; spec and model identity separate | Approved |
| D-W02-10 | Golden-hour card in the left safe area; WP-01 implements | Approved direction |
| D-W02-11 | Forward tapered balconies for **7305/7306 only**: full 7.2 m interior kept; balcony approved at 1.87 m, recorded at the verified **1.86 m (7.92 m²)** | Approved, applied |

## 2. One canonical geometry
`generate.mjs` builds **one set of closed solids** from `vessel.json` (`SOLIDS`; 45 solids, 15,392 triangles). Every output derives from them:

| Output | Derivation |
|---|---|
| `model/aurora-tide-massing.glb` | the solids, one closed mesh each (indexed, flat normals) |
| Overlay faces (`WP02_FACES_OUT`) | exactly the GLB triangles |
| Sheets 01–05, 07 (elevations, bow, stern, plan, three-quarter) | z-buffered orthographic projections of the same triangles (run-length SVG); surface markings drawn on top as annotation |
| Sheets 06, 08–10 (Deck 7, Cabin 7214, Deck 4 + lounge, accommodation validation) | the same canonical side-line functions (`levelWall`, `hullHB`) |

Key rules:
- The hull is lofted from the sheer profile, the raked stem (x 140 at the DWL to 158 at 16.5 m) and the raked transom (x 3 at the DWL to 0 at deck 4). Bow waterplanes are compressed onto the stem. The T1 recess sits at z 10 with a bulwark.
- Superstructure sides follow the hull at their own deck height. Glazing follows each level's local wall.
- D9 is an **open** sun deck. The radomes sit on a mast house.
- Declared omissions (`manifest.canonicalModel.intentionallyOmitted`, GLB `extras.omitted`): underwater body, railings, umbrellas, davits, anchors, markings, sculpted casing, terrace aft-wall glazing, balcony recesses.

## 3. Deliverables
| Deliverable | File |
|---|---|
| Contract (all geometric constants, cabin layout, rules) | [`vessel.json`](vessel.json) |
| Generator / independent verifier | [`generate.mjs`](generate.mjs) / [`verify.mjs`](verify.mjs) → [`review/verify-report.json`](review/verify-report.json) |
| Elevations, bow, stern, plan | [`01`](sheets/01-port-elevation.svg), [`02`](sheets/02-starboard-elevation.svg), [`03`](sheets/03-bow.svg), [`04`](sheets/04-stern.svg), [`05`](sheets/05-plan.svg) |
| Deck 7 arrangement; three-quarter | [`06`](sheets/06-deck7-arrangement.svg); [`07`](sheets/07-three-quarter-massing.svg) |
| Cabin 7214 plan (measured circulation) | [`08`](sheets/08-cabin-7214-plan.svg) |
| Deck 4 + entertainment lounge | [`09`](sheets/09-deck4-lounge.svg) |
| **Accommodation validation (all 104 slots)** | [`10`](sheets/10-accommodation-validation.svg) |
| Concept overlay (seeded) | [`review/concept-overlay.webp`](review/concept-overlay.webp), [`.json`](review/concept-overlay.json), [`overlay.mjs`](overlay.mjs) |
| Manifest (identities, datums, slots, cabin, lounge) | [`manifest.json`](manifest.json) |
| Review reconciliation | [`review/CODEX-REVIEW-RECONCILIATION.md`](review/CODEX-REVIEW-RECONCILIATION.md) |
| Migration plan / production requirements | [`MIGRATION.md`](MIGRATION.md) / [`PRODUCTION.md`](PRODUCTION.md) |

Reproduce: `node design/aurora-tide/generate.mjs && node design/aurora-tide/verify.mjs`. Expect 106/106 passes and a clean tree.
Overlay: `WP02_FACES_OUT=work/faces.json node design/aurora-tide/generate.mjs && PLAYWRIGHT_CHROMIUM_PATH=<chrome> node design/aurora-tide/overlay.mjs work/faces.json`. The seed is `20261112`.

## 4. Verification (independent of the generator)
`verify.mjs` shares no code with the generator. It parses the GLB, the SVGs, the manifest and the spec. Its **106 checks** cover:
- **Identity:** recomputes `massingModelId` from the GLB and matches it against the manifest, every sheet and the overlay.
- **Mesh validity:** finite unit normals, positive areas, valid indices, every solid closed and consistently oriented, positive volume.
- **Glazing attachment:** point-to-mesh distance plus inside test for every vertex.
- **Cross-output:** elevation and plan silhouettes vs GLB slices at every pixel column; Deck 7 footprint vs GLB wall.
- **Datums:** DWL bow and transom, sheer, T1, air draft, open D9, radomes, funnel casing.
- **Footprints:** levels never wider than the hull.
- **Accommodation:** every slot re-measured from the GLB; no overlaps or cores.
- **Lounge:** allocation, widths, no displaced cabins.
- **Cabin 7214:** erosion/BFS reachability at the target widths, entry zone, door swing, pocket door, furniture overlaps, areas from polygons, viewpoints, neighbours, hull fit.
- **Captions and decisions.**

## 5. Identity
| Id | Hash of | Current |
|---|---|---|
| `specId` | `vessel.json` | `e410a0e8…` |
| `generatorId` | `generate.mjs` (LF) | `34da250e…` |
| `massingModelId` | GLB float32 positions (mm) per solid | `fcdaaf8a…` |
| `cameraId` | review camera: projection, transform, framing, crop (**review only**) | `d3065cd5…` |

Experiments:
- spec prose edit → only `specId` changes;
- generator comment → only `generatorId`;
- generator geometry edit → `generatorId` + `massingModelId`;
- Codex's deckHeight 2.9→3.0 → `specId` + `massingModelId`.

The production model and film camera will carry their own identities, bound to the approved spec/model and the source-asset BOM (`manifest.identity.productionIdentityContract`).

## 6. Accommodation (D-W02-3/6)
**104 slots / 208 guests counted.** Each slot is validated over its full footprint (0.05 m sampling): corridor 0.9 + bulkhead 0.12 + interior 7.2 + balcony 2.1 + side structure 0.10 must fit within the deck's side line (deck 4: hull − 0.3 lining).
- **All 104 fit** (re-measured from the GLB by `verify.mjs`).
- 102 use the standard module.
- **7305 / 7306** (deck 7, x 111.4–116) were 0.23 m short with the standard 2.1 m balcony. Under **D-W02-11** they keep their full 7.2 m interior and only their balconies are reduced.
  - You approved 1.87 m (≈7.97 m²) subject to final verification. The full-footprint check allows at most **1.8698 m** (9.2898 m available), so 1.87 m overshoots by 0.2 mm.
  - The recorded value is rounded down to **1.86 m = 7.92 m² clear** (margin 0.01 m).

Capacity stays 104 / ~208. Vessel dimensions, exterior geometry (`massingModelId` unchanged) and Cabin 7214's 9.0 m² balcony are unchanged.

## 7. Cabin 7214 (corrected)
Convention (`cabin7214.convention`): the corridor bulkhead is outside the 7.2 m depth, the glazing frame is centred on 7.2, the balcony runs from 7.25 to 9.25, and areas come from the floor polygons.

The layout is in `cabin7214.layout`:
- entry door on the passage axis (0.90 m, swing clear);
- bathroom beside the entry with a pocket door;
- wardrobe 0.70 × 1.80 m with sliding doors;
- king bed facing the sea, living area at the glazing;
- 4 × 1.15 m sliding panels (doorway 1.11 m) and a private balcony.

| Measure | Value |
|---|---|
| Gross module / interior floor / **net floor** | 33.12 / 32.18 / **31.84 m²** |
| Bathroom / room excl. bath + wardrobe | 5.80 / 24.78 m² |
| **Balcony** | **9.00 m²** (2.00 m clear) |
| Primary route (corridor → balcony) | **0.89 m** (door-limited; target 0.80) |
| Secondary access (11 destinations) | **≥ 0.61 m** (target 0.60) |
| Entry zone / door swing | clear / clear |
| Hull fit (full footprint) | 9.52 of 9.80 m, **margin 0.28 m** |

Position: x 97.6–102.2, zone 2. Neighbours are 7212 (aft) and 7302 (forward). V1–V6 are all in free space with clear sight lines. These are fictional targets, not certified accessibility or safety values.

## 8. Entertainment lounge (D-W02-7)
Deck 4 aft, x 9.00–22.95 m:
- 300.8 m² gross;
- ≈96 seated (design target);
- **0 staterooms displaced** (deck 4 keeps 28);
- the glazed aft wall faces T1.

Acoustic, fire and escape arrangements are not engineered.

## 9. Concept overlay (D-W02-9)
**IoU 89.74 %** on the corrected model. Seed 20261112; two runs byte-identical. Camera az −38.09°, el 6.89°, dist 727.5 m, roll −1.21°. It measures exactly the GLB triangles.

Residuals are each ≤ 1.4 % per length band:
- aft umbrellas and railings;
- the sculpted funnel casing;
- the forefoot below the modelled hull;
- mast equipment.

I did not tune for the percentage.

## 10. Production and framing
- See [`PRODUCTION.md`](PRODUCTION.md): zero spend, no resource confirmed, and a staged L0–L2 look-dev sample before any frame run.
- The golden-hour card move (D-W02-10) is implemented by WP-01 on PR #2.

## 11. Next actions
1. Codex re-reviews the corrected SHA on PR #3.
2. Owner appearance approval → freeze at `1.0.0` (only after Codex's independent review of the updated commit and resolution of all material defects).
3. Ships & Rooms migration from the approved `design/cinematic-luxury` integration SHA, after authorization (`MIGRATION.md` §3).
4. No production modeling, paid resources, merge or deployment without owner authorization.

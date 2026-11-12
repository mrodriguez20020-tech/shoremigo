# Reconciliation: Codex independent review of PR #3 (REQUEST CHANGES)

Review [5869346197](https://github.com/mrodriguez20020-tech/shoremigo/pull/3#pullrequestreview-5869346197) was made on `414b627`.
The corrections below build on `ea1e23e`, which already recorded the owner decisions D-W02-6…10.
**No design restart:** D-W02-1…10, the approved direction, the 104 / ~208 basis and branch ownership are all preserved. No application code changes and nothing is merged or deployed. **Geometry is not frozen at 1.0.0.**

All numbers below are reproducible with `node design/aurora-tide/generate.mjs && node design/aurora-tide/verify.mjs` (**103/103 checks**; full results in `review/verify-report.json`).

| # | Codex finding | Sev. | Status | Correction (files) | Evidence |
|---|---|---|---|---|---|
| 1 | Cabin entry obstructed (wardrobe blocks 0.60 m of the 0.90 m opening; swing hits the wardrobe); metric ignored the bottleneck | P1 | **Fixed** | Entry door re-sited onto the 1.22 m passage (u 2.79–3.69, hinge on the bathroom side). Wardrobe 0.70 × 1.80 m with sliding doors. Bathroom pocket door. WC, bed and nightstands repositioned. The layout lives in `vessel.json` → `cabin7214.layout`, not in code. Circulation is **measured on the floor geometry**: exact distance transform plus widest path from the corridor to 12 destinations (`generate.mjs` → `cabinModel`). `verify.mjs` re-checks it independently by erosion and BFS at 0.025 m. | Primary route 0.89 m (limited by the 0.90 m door). Every secondary destination ≥ 0.61 m. Entry zone (0.9 m inside the opening) clear. Swing envelope clear. No furniture overlaps. Six viewpoints in free space with clear sight lines. Sheet 08 |
| 2 | Elevations, Deck 7 sheet and GLB are different geometries (flat hull, bow to 158 at the waterline, T1 misplaced, D9 enclosed, 112 hard-coded samples, radomes missing from the GLB) | P1 | **Fixed** | **One canonical solid model** (`generate.mjs` → `SOLIDS`) built from `vessel.json`. The GLB, the overlay faces and sheets 01–05 and 07 are z-buffered projections of the same 15,392 triangles; sheets 06 and 08–10 use the same side-line functions. Hull lofted from the sheer profile, raked stem (x 140 at the DWL to 158 at 16.5 m), raked transom (x 3 at the DWL) and the T1 recess. T1 deck at z 10, x 3–9, with a bulwark. Deck 4 enclosure fills hull → deck 5. **D9 is an open sun deck** (teak plate + glass windscreen). The radome mast house carries the radomes, which are **in the GLB**. The funnel casing now starts at the deck 8 wall (x 27, was 26). Footprints are sampled from their own extents. Omissions are declared in the GLB `extras.omitted` and on each sheet. | Port, starboard and plan sheets match GLB slices at **every pixel column** (≈2,085 per sheet, two-sided test). Deck 7 footprint spans exactly 21.00–129.00 and matches the GLB wall to 0.0044 m. Stem at the DWL 140.00, transom at the DWL 3.00, T1 at z 10 / x 3–9, hull top = sheer profile, no deck 9 mass, radomes present, overlay faces = GLB triangles |
| 3 | Glazing floats up to 2.22 m outside the tapered superstructure (midpoint strip) | P1 | **Fixed** | Each band is lofted station by station on its own level's wall line, on both sides: 5 mm off the wall, 60 mm thick. The lounge glazing sits on the deck 4 enclosure, its aft glass wall faces T1, and the D9 windscreen rests on the plate. | Every glazing vertex lies within 0.067 m of its host wall surface and none is inside it (point-to-mesh distance + ray parity on the GLB). Windscreens rest on the plate, footprint inside |
| 4 | 1,032 zero-length normals, 148 zero-area triangles, invalid fan caps | P2 | **Fixed** | Collapsed ends close through side faces. Caps are fanned from the centroid. Degenerate triangles are removed before export. Normals are computed per triangle. One closed mesh per solid with valid indices. | 0 zero normals, 0 zero-area triangles, 0 winding mismatches. All indices valid. **All 45 solids closed and consistently oriented** (each edge used once per direction) with positive volume |
| 5 | `geometryId` = JSON only; DH 2.9→3.0 changed the GLB but not the id; constants outside the spec | P2 | **Fixed** | `specId` / `generatorId` / `massingModelId` (from the GLB float32 positions, recomputable from the GLB alone) / `cameraId`. Deck height, rakes, sheer, taper, glazing, slot rules, partitions and the cabin layout all moved into `vessel.json`. The review camera now covers projection, transform, framing and crop, and is marked review-only. A production identity contract is in the manifest. | Experiments: spec prose edit → only `specId` changes. Generator comment → only `generatorId`. Generator geometry edit → `generatorId` + `massingModelId`. **Your deckHeight 2.9→3.0** → `specId` + `massingModelId`. The verifier recomputes the model id from the GLB and matches it against the manifest, every sheet and the overlay |
| 6 | Capacity counted slots without full-footprint checks (D7 111.4–116 short) | P2 | **Confirmed; correction proposed** | Each slot is validated over its full footprint (0.05 m sampling) against its deck's side line: corridor 0.9 + bulkhead 0.12 + interior 7.2 + balcony 2.1 + side structure 0.10 (deck 4: hull − 0.3 lining). Sheet 10. | **102/104 fit.** 7305/7306 (deck 7, x 111.4–116) are short by **0.23 m**, matching your 9.2898 m. **Proposal (owner decision, not applied):** keep the slot and the 7.2 m interior and shorten only those two balconies to 1.87 m (7.97 m²). Capacity stays 104 / ~208. Margins re-measured from the GLB match the manifest |
| 7 | Area/partition datums disagree (31.9 = 4.5 × 7.08; corridor wall in or out) | P2 | **Fixed** | Single convention in `cabin7214.convention`: the corridor bulkhead is outside the 7.2 m depth, the glazing frame is centred on 7.2, and the balcony runs from 7.25 to 9.25. Areas come from the floor polygons. The hull fit includes the 0.10 m side structure. | Gross module 33.12, interior floor 32.18, **net 31.84 m²** (partitions 0.33 subtracted), bathroom 5.80, room excl. bath + wardrobe 24.78, **balcony 9.00 m² (2.00 m clear)**. Hull fit **9.52 of 9.80 m, margin 0.28 m** (was a reported 0.38 without the structure allowance) |
| 8 | Air draft 37.5 is the baseline height of the mast top, not air draft | P2 | **Fixed** | `principal.airDraft.aboveDWL = 32.1` with its definition. `airDraftToMastTop` removed; geometry unchanged. Elevations annotate "air draft 32.1 m above DWL (mast top z 37.5 m above baseline)". | Verifier: GLB mast top − DWL = 32.10 m |
| 9 | Stale neighbour 7216, sheet 08 x 99.0–103.6, sheet 06 rename prompt, migration decisions | P3 | **Fixed** | Neighbours and position are derived from the slot list: 7212 aft, **7302** forward, x 97.6–102.2. Captions regenerated. Removals (Interior, theatre, splash), the future-only Tidekeeper Suite and the located lounge are in `vessel.json`/`MIGRATION.md` (most were already in `ea1e23e`). | No stale 9214/7216 in any sheet (only "formerly 9214" on 08). Sheets 06/08 state x 97.6–102.2 |

## Overlay (re-measured on the corrected model)
- **IoU 89.74 %.** Seed 20261112; two runs byte-identical.
- Camera: az −38.09°, el 6.89°, dist 727.5 m, roll −1.21°.
- Hashes recorded: concept `57502ff3…`, faces input and model.
- It measures exactly the GLB triangles, with no proxies.

The drop from the previous 89.86 % mostly reflects correctly opening D9. The remaining residuals (each length band ≤ 1.4 %) are:
- umbrellas and railings on the aft terraces;
- the sculpted funnel casing;
- the forefoot below the modelled hull;
- mast equipment.

As instructed, I did not tune the geometry to raise IoU.

## Branch / migration correction
`MIGRATION.md` §3 now bases the Ships & Rooms migration on the **approved `design/cinematic-luxury` integration SHA after owner-authorised integration**, not `main`. It uses a **generated typed adapter** from `vessel.json`/`manifest.json`, so no facts are duplicated by hand. The fallback is an explicitly dependent draft branch targeting WP-02. No changes to `main`.

## Still open
1. **Owner decision** on the 7305/7306 tapered-balcony proposal; the alternative is to accept 102 standard + 2 variant, or another layout change.
2. **Codex re-review of the exact corrected SHA.**
3. Then owner appearance approval → `1.0.0` freeze.
4. WP-01 golden-hour card implementation (Codex, PR #2).
5. Production resources (none confirmed; no spending authorised).

Cabin clearances and the lounge capacity are fictional design targets, not certified accessibility, occupancy or maritime-safety values.

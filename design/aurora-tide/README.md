# WP-02 · Canonical Aurora Tide: architecture, design control and production strategy

**Owner:** Claude (implementation) · **Independent reviewer:** Codex · **Appearance approval:** project owner
**Branch:** `feat/wp02-aurora-tide` from `design/cinematic-luxury` @ `000a837adfa8bf3ed39f05be61e09a4bc3f6df3e`. Not based on unmerged WP-01 (PR #2); its shared documents were read by exact ref `c64ace1` and are not imported.
**Status:** provisionally approved direction (owner decisions 2026-11-12), **awaiting Codex independent review**, then final appearance approval. Massing/design control only: **not** a production model, **not** a photoreal render, **WP-02 not complete**.

## 1. Owner decisions recorded (2026-11-12)
| ID | Decision | Status |
|---|---|---|
| D-W02-1 | Cabin 9214 → **Cabin 7214**, Premium Balcony Stateroom, Deck 7 port. No owner's-suite conversion, no deck re-basing; the approved luxury interior/spatial experience is preserved. | Approved |
| D-W02-2 | 158 × 23 × 5.4 m, nine decks, four stepped aft terraces, three principal panoramic bands, pearl-white superstructure, deep navy hull, restrained sea-glass. Fictional design-control values. | Provisionally approved |
| D-W02-3 | Replace 1,900 guests / 14 decks with **~208 guests, 104 staterooms, nine decks**; derived capacity is the design basis. | Approved |
| D-W02-4 | Mirrored starboard, stepped stern + marina platform, Deck 8 forward bridge, proposed funnel, Deck 9 open sun deck, Deck 7 aft recreation/terrace. Present sheets + concept overlay before freezing. | Provisionally approved |
| D-W02-5 | Zero unapproved spending; no production rendering until Codex review, defects fixed, design approved, film-framing conflict resolved, viable resource arranged. GLB is massing only. | Constraint |

Recorded machine-readably in [`vessel.json`](vessel.json) → `decisions`.

## 2. Deliverables
| Deliverable | File |
|---|---|
| Canonical parametric contract (single source of truth) | [`vessel.json`](vessel.json) |
| Generator (zero deps; every view, GLB and hashes from the one spec) | [`generate.mjs`](generate.mjs) |
| Port / starboard elevations | [`sheets/01`](sheets/01-port-elevation.svg), [`sheets/02`](sheets/02-starboard-elevation.svg) |
| Bow / stern | [`sheets/03`](sheets/03-bow.svg), [`sheets/04`](sheets/04-stern.svg) |
| Plan + Deck 7 arrangement (Cabin 7214 highlighted) | [`sheets/05`](sheets/05-plan.svg), [`sheets/06`](sheets/06-deck7-arrangement.svg) |
| Three-quarter massing (A-02 framing family) | [`sheets/07`](sheets/07-three-quarter-massing.svg) |
| **Cabin 7214 floor plan** | [`sheets/08`](sheets/08-cabin-7214-plan.svg) |
| **Concept-overlay comparison (measured)** | [`review/concept-overlay.webp`](review/concept-overlay.webp), [`review/concept-overlay.json`](review/concept-overlay.json), tool [`overlay.mjs`](overlay.mjs) |
| Massing model (glTF 2.0) | [`model/aurora-tide-massing.glb`](model/aurora-tide-massing.glb) |
| Identity manifest (geometryId, cameraId, file hashes, capacity, cabin metrics) | [`manifest.json`](manifest.json) |
| App/document migration inventory | [`MIGRATION.md`](MIGRATION.md) |

Regenerate: `node design/aurora-tide/generate.mjs`. Overlay: `WP02_FACES_OUT=work/faces.json node design/aurora-tide/generate.mjs && PLAYWRIGHT_CHROMIUM_PATH=<chrome> node design/aurora-tide/overlay.mjs work/faces.json` (needs the repo's Playwright dev dependency).

## 3. Concept overlay: measured fit and corrections
The overlay fits a perspective camera to the transparent A-02 silhouette and reports intersection-over-union, plus a map (red = in the concept, missing from the model; blue = model where the concept has nothing).

| Pass | Silhouette IoU | Corrections applied |
|---|---|---|
| Proposal (`0.1.0`) | **84.5 %** | none: revealed aft tiers too short, funnel too low, forward superstructure too long, radomes/mast too far forward, insufficient stem rake |
| 1 | 89.1 % | aft tiers extended aft; forward ends shortened (open forecastle); funnel raised to 34.5 m with swept casing base; radomes/mast moved aft, main radome enlarged; stem rake increased |
| 2 | 89.3 % | decks 5–7 forward ends −4 m; deck 8/upper terraces further aft; funnel 36.0 m, longer casing; radomes on a 2.0 m platform; mast x 108 m; waterline stem 140 m |
| 3 (current) | **≈ 90 %** (89.9–90.2 % across re-runs; the camera fit uses random search; the radome platform added in this pass costs ~0.2 pt) | bow sheer lowered 18.7 → 16.5 m; radome platform modeled |

Residuals (each length band < 2 %): umbrellas, railings and planters (omitted by design); the funnel casing's **sculpted swept form** (massing is boxy, for the production modeler); a small excess at the lower bow (1.8 %); radome/mast detailing. Tuning stopped deliberately: A-02 is a generated image with non-physical perspective, so further fitting would chase artifacts. Capacity stayed **104 / ~208**; Cabin 7214 is now x 97.6–102.2 m (computed).

## 4. Cabin 7214 (formerly 9214)
Plan inside the approved envelope (4.6 m module, 7.2 m interior, 2.1 m balcony, 2.4 m clear ceiling), with partitions (cabin 0.10, corridor 0.12, bathroom 0.08 m):
- Bathroom inboard beside the entry (2.50 × 2.20 m: shower, vanity, WC); full-height wardrobe opposite; entry passage 1.22 m.
- King bed (1.93 × 2.03 m) with its headboard on the bathroom/wardrobe wall, facing the sea; side clearances 1.28 m and 0.79 m.
- Living area at the glazing: sofa, coffee table (1.12 m from the bed foot), armchair, desk.
- Panoramic sliding glass doors: 4 × 1.15 m panels on the ship's mullion rhythm; private balcony 9.0 m² clear, glass balustrade, privacy screens to 7212/7216.
- **33.1 m² gross / 31.9 m² net interior**; fits the hull at its position (9.42 m needed of 9.8 m; 0.38 m for structure/risers).
- Materials: light oak, warm ivory, champagne hardware, sea-glass accents. Lighting states: daylight, golden hour, evening.
- Six viewpoints (V1 entry … V6 balcony-in, eye height 1.6 m) define the only allowed spatial render positions; WP-03 must build one connected space from this plan, not unrelated views.

## 5. Zero-cost production route (assessment, nothing confirmed)
**Local machine: not viable.** i3-4005U (2C/4T, 2013), Intel HD (no Cycles GPU), 7.9 GB RAM, 6.1 GB free disk, no Blender. Extrapolated from Codex's rejected proof (~49 s/frame, 1100×660, 32 samples): ~10–40 min/frame here for the M-01 contract → ~130–500 h for 768 frames; EXR masters ~12–19 GB won't fit. The limiting factor is modeling/look-dev skill, so the proof was not repeated.

| Need | Zero-cost candidate | Status / caveat |
|---|---|---|
| Software | Blender 4.x (GPL): Ocean modifier / Geometry-Nodes FFT ocean, Cycles + OpenImageDenoise, AgX; FFmpeg | Free, viable; not installed here |
| Environment/materials | Poly Haven CC0 HDRIs and textures (sky, teak, painted metal) | Free, CC0; verify each asset at use |
| Rendering | (a) a team machine with NVIDIA RTX ≥ 8 GB or Apple Silicon (Cycles Metal): ~4–13 h for 768 frames; (b) **SheepIt Render Farm** (free community Blender farm; earn priority by rendering others' frames); (c) Google Colab / Kaggle free GPUs | **None confirmed.** (a) needs the owner to identify hardware; (b) project files are rendered on volunteer machines and per-frame limits apply, so check current terms and confidentiality; (c) quotas are unpredictable and rendering may conflict with their terms, so lowest confidence |
| Hard-surface model + look-dev (~40–80 h) | Owner or a team member with Blender skills, using `vessel.json`, the elevations and the GLB as blockout | **Not confirmed; this is the critical blocker.** No paid freelancer authorized |
| Loop/wake technique | Tracked ship (static in camera, ocean advected); blend ocean evaluations at *t* and *t − T* across the seam; periodic advected wake/foam fields; same frames for day/sunset | Defined; needs the artist |

**Recommended route:** Blender + Poly Haven CC0, a team member as modeler working from this contract, and rendering on identified team hardware with SheepIt as fallback after a terms check. Commission nothing until all five D-W02-5 gates pass.

## 6. Film-framing conflict (D-W02-5 gate 4)
The WP-01 spec places the ship at x 57–94 % of a single persistent wide shot used by both the hero and the golden-hour window; the golden-hour "Featured excursion" card occupies the same region. Because the film is one frozen camera across both windows, the coherent fix is to **move the card** (e.g. below the copy in the left 45 % column at ≥1024 px), not to reframe the ship per section. Proposed to the WP-01 owner on PR #2; not resolved until accepted there.

## 7. Rights and provenance
`generate.mjs`/`overlay.mjs` are repository source code. `vessel.json`, the sheets, the overlay image and the GLB are design assets derived from the team-created A-02 concept: not MIT-licensed, fictional vessel, no third-party models/textures/real ship data. Recorded in `ASSETS.md`. A future production BOM must record every source and licence.

## 8. Codex independent review: handoff
Review the actual branch head (see PR #3), base `000a837`. Please check:
1. **Geometry vs A-02:** reproduce the overlay (command above) and confirm IoU ≈ 90 %; inspect the red/blue map; flag any structural residual you consider a defect (funnel casing form, lower bow, aft terrace extents).
2. **Consistency:** all sheets, the GLB bounds (158 m length, ~24 m incl. boats) and `manifest.json` come from one `vessel.json` (re-run `generate.mjs`; tree must stay clean).
3. **Capacity rule and Cabin 7214:** numbering convention, computed position, envelope arithmetic, clearances and hull fit.
4. **Unseen geometry (D-W02-4):** starboard mirror, stern/marina, Deck 8 bridge, Deck 9 sun deck, funnel.
5. **Migration inventory:** completeness against current `src/` (re-grep at review time).
6. **Production assessment:** soundness of the estimates and zero-cost route.
Return findings on PR #3 (file/line, evidence, severity). Do not merge.

## 9. Next actions
1. Codex reviews PR #3; I correct confirmed defects on this branch.
2. Owner final appearance approval of the corrected sheets + overlay → bump `vessel.json` to `1.0.0`, freeze `geometryId`.
3. WP-01 owner accepts/rejects the golden-hour card move (PR #2).
4. Owner identifies a modeler and render hardware (or approves another zero-cost route).
5. Then (only then): Blender blockout from the GLB → turntable → 3–5 s joint water/wake look-dev → matched loops.

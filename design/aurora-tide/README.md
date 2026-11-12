# WP-02 · Canonical Aurora Tide: architecture, design control and production strategy

**Owner:** Claude (implementation) · **Independent reviewer:** Codex · **Appearance approval:** project owner
**Branch:** `feat/wp02-aurora-tide` from `design/cinematic-luxury` @ `000a837adfa8bf3ed39f05be61e09a4bc3f6df3e` (fetched 2026-11-12). Not based on unmerged WP-01 (PR #2); its shared documents were read by exact ref `c64ace1` and are **not** imported here.
**Status:** PROPOSED design control, awaiting owner decisions. **Not** a production model, **not** a photoreal render, **not** WP-02 completion.

## 1. What this package delivers now

| Deliverable | File | Nature |
|---|---|---|
| Canonical parametric geometry contract | [`vessel.json`](vessel.json) | Single source of truth: principal dimensions, deck stack (z), superstructure footprints, terraces, glazing bands, lifeboat bay, funnel, radomes, mast, accommodation rule, Cabin 9214 options, unseen/assumed list |
| Generator | [`generate.mjs`](generate.mjs) | Zero-dependency Node script; derives **every** view, the GLB and the hashes from `vessel.json`, so views cannot disagree |
| Port / starboard elevations | [`sheets/01-port-elevation.svg`](sheets/01-port-elevation.svg), [`02-starboard`](sheets/02-starboard-elevation.svg) | Deck datums, terraces T1–T4, glazing rhythm, lifeboat bay, funnel/radomes/mast, LOA |
| Bow / stern views | [`03-bow`](sheets/03-bow.svg), [`04-stern`](sheets/04-stern.svg) | Transverse, beam, stepped terraces end-on (both unseen in A-02 → proposals) |
| Plan + Deck 7 arrangement | [`05-plan`](sheets/05-plan.svg), [`06-deck7-arrangement`](sheets/06-deck7-arrangement.svg) | Stepped footprints; schematic cabins, corridor, cores, Option-A cabin highlighted |
| Three-quarter massing | [`07-three-quarter-massing`](sheets/07-three-quarter-massing.svg) | Elevated port-aft review camera (A-02 framing family), same geometry |
| Massing model | [`model/aurora-tide-massing.glb`](model/aurora-tide-massing.glb) | glTF 2.0, 7 materials, 3,236 triangles, 158 m × 24 m (incl. boats) × 32.1 m above waterline; geometryId embedded |
| Identity manifest | [`manifest.json`](manifest.json) | `geometryId`, `cameraId`, per-file SHA-256, derived capacity, Cabin 7214 computed position |

Regenerate: `node design/aurora-tide/generate.mjs` (Node ≥ 18). Hashes change whenever `vessel.json` changes; the **approved** canonical `geometryId` is issued only after owner approval.

## 2. Architecture findings (from A-02, `public/cinematic/aurora-tide.webp`)

Observed (high confidence): navy hull with sea-glass boot-top and sheer stripe; two hull window rows (sparse portholes near the waterline, rectangular windows above); a recessed **lifeboat bay** with **two orange enclosed boats** and liferaft canisters; **three continuous panoramic glazing bands** above the hull; a top glazed level beneath a radome platform; **four stepped aft terraces** (planters, loungers, the highest with umbrellas); sculpted funnel aft of midship with **four exhausts** over a louvered navy casing and sea-glass stripe; **two radomes**; a mast forward; raked bow whose navy hull rises to the forecastle.

Derived deck stack (conventional numbering, decks 1–2 below the waterline): **D3 Marina · D4 Oceanview (T1) · D5 Promenade/lifeboats (T2) · D6 Horizon (T3) · D7 Meridian (T4 umbrellas) · D8 Observation · D9 Sun deck**. Nine decks; the highest stateroom deck is **Deck 7**.

Incompatibilities found in the existing product (read-only, not changed here):
- `src/lib/domain/ship.ts`: "≈1,900 guests", "14 decks", Skywatch Deck 14, Spa 12, Lido 11 → impossible on this hull.
- `ShipExplorer.tsx` side profile: generic 11-tier block with a coral funnel → not A-02.
- "Cabin 9214, Balcony Stateroom, Deck 9" → Deck 9 is the open sun deck in the concept.

Unseen in A-02 (all marked *proposed* in `vessel.json`): starboard side (mirrored), stern transom/marina platform, bow front and mooring deck, Deck 8 bridge vs observation split, funnel plan shape, pool size/location on Deck 7 aft.

## 3. Proposed canonical design (owner approval required)

| Item | Proposal | Basis |
|---|---|---|
| LOA / beam / draft | **158 m / 23 m / 5.4 m**; air draft ~37.5 m | A-02 generation brief (~160 m, 5–6 tiers); L/B 6.9 boutique/expedition proportion; portholes just above the waterline |
| Decks | **9** (D1–D2 below waterline; D3–D9 visible) | Counted from A-02 |
| Accommodation | **104 staterooms, ~208 guests** (double occupancy), ~150 crew (assumption) | Derived by `generate.mjs` from a 4.6 m module, central corridor, three cores (D4 28, D5 18, D6 28, D7 30) |
| Palette | pearl `#f1ece2`, navy `#132a45`, sea-glass `#7fc8bd`, glazing `#1b2a33`, teak, lifeboat orange | Sampled/approximated from A-02 |
| Cabin 9214 | **Decision D-W02-1 below** | Conflict with concept |

### Decisions requiring the owner
| ID | Decision | Options (recommendation first) |
|---|---|---|
| **D-W02-1** | Cabin 9214 cannot be a Deck-9 balcony stateroom on this hull | **A. Rename the demo cabin 7214** (Deck 7 port, zone 2, computed x 99.0–103.6 m; keeps class and plausible numbering). B. Keep "9214" as a top-deck owner's suite (changes class). C. Re-base deck labels +2 (keeps the name; least plausible). |
| D-W02-2 | Principal dimensions and 9-deck stack | Approve 158 × 23 × 5.4 m / 9 decks, or supply alternatives before final modeling |
| D-W02-3 | Capacity shown in the app | Replace "≈1,900 guests / 14 decks" with derived ~208 guests / 9 decks (code change belongs to a scoped ship-module package) |
| D-W02-4 | Unseen geometry | Approve the mirrored starboard, the stepped stern proposal (04-stern), Deck 8 forward = bridge (assumed), funnel plan |
| D-W02-5 | Production resource | Choose a zero-cost route in §5 or authorize spending; without it, M-01/M-02 stay blocked |

## 4. Reuse across WP-01, WP-02, WP-03
- **One identity:** the production model must conform to `vessel.json` (dimensions, deck z, footprints, feature positions). Its `geometryId` (hash of the approved spec + model) and the frozen camera rig `cameraId` go into `public/cinematic/film/manifest.json` (WP-01 contract, unchanged).
- **WP-01 film (M-01):** rendered from the same scene and cameras. Note the PR #2 review finding N5: the wide framing contract (ship x 57–94 %) collides with the golden-hour card; fix the mask before commissioning.
- **Ships & Rooms decks:** a later scoped adapter can draw the explorer's deck profile from `vessel.json` (no hand-drawn second ship). Not done here (ship module is read-only for WP-02).
- **WP-03 Cabin:** uses the unit module (4.6 m × 7.2 m + 2.1 m balcony), the glazing mullion rhythm (1.15 m) and the cabin's exterior position. WP-03 still needs an approved floor plan; this contract only fixes the envelope.

## 5. Production pipeline: can it be done locally? (measured, not assumed)
**This machine cannot produce the approved quality.** Intel i3-4005U (2 cores / 4 threads, 1.7 GHz, 2013), Intel HD Graphics (no Cycles GPU backend), 7.9 GB RAM, **6.1 GB free disk**, no Blender installed. Codex's rejected Blender proof took ~49 s/frame at 1100×660, 32 samples on 3 cores. Scaling to the M-01 contract (1920×1080, ~128–256 samples, 192 frames × 2 lights × 2 cameras = **768 frames**) gives roughly **10–40 min/frame here → ~130–500 hours**, and the scene-linear EXR masters (~15–25 MB/frame, **~12–19 GB**) would not fit on disk. More importantly, the failed proof showed the limiting factor is **hard-surface modeling and look-development skill**, not samples. I did not repeat it.

What **is** feasible without spending:

| Stage | Tool / resource | Cost | Status |
|---|---|---|---|
| Design control (this package) | Node generator, SVG/GLB | 0 | **Done** (proposal) |
| Hero model to the contract | Blender 4.x (free, GPL; outputs owned by the author) + a **hard-surface 3D artist** (~40–80 h incl. glazing, railings, terraces, lifeboats, funnel detail) | 0 if owner/team/volunteer; otherwise paid freelance (needs approval) | **BLOCKED: no artist assigned** |
| Ocean, wake, light | Blender Ocean modifier or Geometry-Nodes FFT ocean; a **tracked ship** (static in camera, ocean advected) makes the loop solvable: blend two ocean evaluations at *t* and *t − T* over the seam; wake/foam as advected periodic fields + Dynamic Paint/Geometry Nodes foam; Nishita sky, sun ~25° day / 3–5° golden; AgX view transform | 0 | Pipeline defined; needs the artist + render hardware |
| Rendering | Cycles on an **NVIDIA RTX-class GPU (≥ 8 GB)** with OpenImageDenoise: ~20–60 s/frame at 1080p → 768 frames ≈ **4–13 h** | 0 on an owner/team machine; Google Colab free GPU is a possible but unguaranteed fallback (session limits, terms to check) | **BLOCKED: no GPU machine available here** |
| Encode/deliver | FFmpeg H.264 yuv420p faststart, frame-0 WebP posters, `media:check` | 0 | Ready (WP-01 tooling) |

Rejected routes: image-to-video generation (cannot hold one geometry across matched lights and frames; violates the spec); real-time WebGL ocean as the hero (won't reach photoreal on low-end phones; D-004 prefers pre-rendered); compositing a ship cut-out over stock ocean (forbidden).

## 6. Rights and provenance
- `generate.mjs` is original source code (repository code licence).
- `vessel.json`, the SVG sheets and the GLB are **design assets derived from A-02** (team-created AI-generated concept). Like A-02 they are **not** covered by the MIT code licence and describe a **fictional** vessel. No third-party model, texture, font outline or real ship data was used. Recorded in `ASSETS.md`.
- A future production model/texture BOM must list every source and licence (commercial web display + derivatives) before use.

## 7. Remaining blockers
1. **Owner decisions D-W02-1…5.** Final modeling must not start before D-W02-1/2/4.
2. **Specialist resource:** a hard-surface 3D/look-dev artist and an RTX-class GPU machine (or authorized spending). Without them no believable ship/water/wake/reflection render can be produced, and WP-01 visual acceptance stays blocked.
3. Production spec conflict N5 (golden-hour mask) to resolve before M-01.

## 8. Exact next actions
1. Owner: decide D-W02-1…5 (comment on the WP-02 PR or in `DECISIONS.md` once PR #2's documents merge).
2. Codex: independent review of this branch (geometry plausibility vs A-02, numbering, capacity rule, hashes).
3. After approval: bump `vessel.json` to `1.0.0`, regenerate, freeze `geometryId`; produce an A-02 overlay sheet at the approved camera.
4. Artist/GPU available: block out the hull/superstructure in Blender from the GLB + elevations, then the turntable and a 3–5 s joint water/wake lookdev (spec §7), reviewed against A-02 before any looping masters.
5. Separately scoped later: Ships & Rooms adapter reading `vessel.json`; WP-03 floor plan inside the Option-A envelope.

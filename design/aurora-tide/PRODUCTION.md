# Aurora Tide production source and asset requirements (zero-spend plan)

**Status:** requirements and plan only. **No production work has started. No modeler, GPU or render farm is confirmed. No spending is authorized** (D-W02-5).
Rendering starts only after the five D-W02-5 gates pass:
1. Codex review;
2. defects corrected;
3. design approved;
4. framing implemented;
5. a viable resource exists.

Target deliverable: **M-01** matched signature films as defined by WP-01 (`docs/ASSET_REGISTRY.md` on PR #2):
- **Duration:** 8 s / 192 frames / 24 fps preferred.
- **Variants:** wide 1920×1080 and portrait 900×1440 (or 720×1280), each in daylight and golden hour, for 768 frames total.
- **Delivery:** silent H.264 MP4 (≤ 6 MB wide, ≤ 2.5 MB portrait) plus a frame-zero WebP poster.
- **Consistency:** identical geometry, camera and phase within each day/sunset pair.

## 1. Inputs supplied by WP-02 (frozen at `vessel.json` 1.0.0)
| Input | Use |
|---|---|
| `vessel.json` (`specId`) | dimensions, deck heights, superstructure stations, glazing bands, funnel/radome/mast, palette |
| `model/aurora-tide-massing.glb` (`massingModelId`) | blockout: one closed mesh per solid (validated by `verify.mjs`); import, verify 158 m LOA, model hard-surface detail over it; never ship it as the final asset |
| Sheets 01–10 | elevations/plan/arrangements for detailing; sheet 07 + overlay camera for A-02 framing |
| `review/concept-overlay.json` | fitted camera (az −38.09°, el 6.89°, roll −1.21°, seed 20261112) as a starting point for the WP-01 wide camera |
| `cameraId`, overlay seed | reproducibility of review framing |

## 2. Production source (reusable)
- **Software:** Blender 4.x LTS (GPL), Cycles with OpenImageDenoise, AgX view transform, and FFmpeg for encoding. All free.
- **One `.blend` scene**, Z-up, metres, with these collections:
  - `SHIP_hull`, `SHIP_superstructure`, `SHIP_glazing`, `SHIP_details` (rails, boats, radomes, mast, funnel);
  - `ENV_ocean`, `ENV_wake_foam`, `ENV_sky`, `ENV_island`;
  - `CAM_wide`, `CAM_portrait`.
- **Ship:** stays static at the origin. The camera is locked to it and the ocean is advected past it ("tracked ship" loop technique).
- **Ocean:** an FFT ocean (Ocean modifier or Geometry Nodes) with a period equal to the loop length *T*. Seam crossfade between the evaluations at *t* and *t − T*. Wake and foam are periodic advected fields with seeds recorded.
- **Lighting:** two light rigs on **identical geometry and camera**:
  - day: CC0 HDRI + sun;
  - golden hour: CC0 HDRI + low sun.
  No colour-grade substitute for physical golden hour.
- **Materials:** pearl-white painted steel, deep-navy hull, sea-glass accents, teak decks, tinted glazing, orange lifeboats. Hex values come from `vessel.json` → `identity.palette`.
- **Masters:** 16-bit half EXR multilayer (beauty plus cryptomatte/mask for UI-safe checks). Masters stay off the web.
- **Bill of materials:** every source file with its licence, URL, retrieval date and SHA-256, plus all seeds and the camera-rig hash.
- **Identity (D-W02-9, Codex finding 5):**
  - The production model id binds the approved `specId` and `massingModelId` (the blockout it was built to), the production scene/mesh file hashes, and every BOM source hash (`manifest.identity.productionIdentityContract`).
  - The **production film camera** identity is separate from the WP-02 review camera. It covers intrinsics (focal length, sensor, projection), extrinsics (transform per frame), output resolution/crop, and WP-01's post-`object-fit: cover` safe-area masks.

## 3. Asset requirements
| Asset | Source (zero cost) | Requirement |
|---|---|---|
| Hard-surface ship model | team-built in Blender from §1 | matches sheets ±0.1 m on principal stations; overlay against A-02 should stay at or above the massing's 89.74 % (design-control target, not a substitute for geometric correctness) |
| Daylight + golden-hour skies | Poly Haven HDRIs (CC0) | verify licence page per asset at download; record in BOM |
| Painted metal, teak, glass, rubber textures | Poly Haven / ambientCG (CC0) | same |
| Island backdrop | modeled or CC0 terrain + HDRI | fictional, no identifiable real location |
| Ocean, wake, foam | procedural in Blender | periodic, seeded |

## 4. Look-development sample (before committing to 768 frames)
Each stage produces evidence, and the next stage starts only if its go/no-go criteria are met.

| Stage | Output | Go/no-go criteria | Est. effort / compute |
|---|---|---|---|
| **L0 material & light stills** | 3 stills at 960×540 from the wide camera on the **blockout GLB** with real materials: day, golden hour, close hull/water detail | silhouette still reads as A-02; materials and palette approved; golden hour is physical light, not a grade | ~1 day modeler; ~5–15 min/still at 64 spp + OIDN on CPU (feasible even on the local laptop, *if Blender were installed*) |
| **L1 water + wake clip** | 48 frames (2 s) at 960×540, day only, ocean and wake against the static blockout ship | believable small waves, coherent bow/stern wake, no visible seam when looped over a 2 s period | ~1–2 days; ~4–12 h CPU or ~20–60 min on an RTX-class GPU |
| **L2 matched pair** | 192 frames × day + sunset at 1280×720 (wide only), detailed ship | clean 8 s loop; frame correspondence across lights; passes WP-01 contact-sheet and mask checks | needs GPU (~2–6 h RTX) or SheepIt; **not** on the local laptop |
| **Production** | full M-01 set (768 frames) | WP-01 acceptance | ~4–13 h RTX-class, or farm |

Notes:
- Estimates are extrapolated from Codex's rejected proof (~49 s/frame at 1100×660, 32 spp). They are not measured on target hardware.
- Blender is **not installed** here. Installing it (~350 MB download, ~1 GB on disk, 6.1 GB free) needs owner approval. Even then the laptop is only suitable for L0.
- L0 needs no detailed model. It tests the materials, light and camera that the expensive stages depend on.

## 5. What stays blocked, and what doesn't
- **Blocked until a resource exists:** the detailed ship model, L1+, and the final films.
- **Not blocked:** the Ships & Rooms application migration ([`MIGRATION.md`](MIGRATION.md)). It may use the generated schematics or massing as an honestly labelled development preview, never presented as the final photorealistic vessel.

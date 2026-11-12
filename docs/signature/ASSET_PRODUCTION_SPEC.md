# Aurora Tide signature environment — production specification

**Delivery status: missing production media.** This is the handoff for an artist/render workflow, not a claim that the scene has been produced. The public delivery manifest must remain `awaiting-production-media` until the files below exist and pass technical and visual review.

## 1. Authority and source scene

Model the fictional Aurora Tide from `public/cinematic/aurora-tide.webp`. Preserve its pearl-white architecture, deep navy hull, sea-glass trim, panoramic glazing, tiered observation decks, silhouette, funnel/radome arrangement and visible lifeboat placement. Use `island-ocean.webp` for the fictional Caribbean environment identity. `signature-still.webp` is only an interim lighting/composition study, not an alternative geometry authority.

Author **one canonical exterior model**, water simulation, island/environment and shared scene. Deliver editable `.blend` or equivalent production source plus an interchange `.usd`/`.glb` for the approved vessel. Include textures, generators, simulation seeds/caches and all dependencies. Create geometry and camera-rig SHA-256 identifiers in the delivery manifest; retain them for subsequent exterior/deck/cabin work. Freeze a version before rendering both lighting states. Never generate incompatible exterior architecture for different angles.

The single approved concept does not establish hidden-side geometry, precise dimensions or a verified cabin/deck plan. Resolve unseen views with a contact sheet and obtain art-direction approval before final modeling. Do not label provisional proportions as engineering facts or claim that Cabin 9214 has been spatially authored. Existing explorer diagrams remain functional fictional demos.

## 2. Shot and framing

An elevated port-aft three-quarter establishing shot looks toward the vessel's bow, open water and a distant lush island. Give the ship a credible, restrained tracked progression rather than an orbit or dramatic fly-through. No real cruise line, destination claim, port landmark, signage or unrelated stock vessel.

Use the following **starting framing targets**, then approve against actual interface masks:

| Composition | Source camera | Safe composition |
|---|---|---|
| Wide | 1920 × 1080, target 35–50 mm equivalent; frozen camera/track | Left 45% remains quiet for headline and navigation. Starting ship bounds: x 57–94%, y 42–69%. Keep water below the hull and clear horizon separation. |
| Portrait | 900 × 1440 or 720 × 1280; purpose-framed second camera from the same scene | Show the complete recognizable vessel in the upper/middle environment without colliding with 320/390 px headline, bottom launcher or personalization controls. Do not rely on cropping the wide shot. |

Keep a 90 px top navigation zone and a 100 px bottom control zone in the actual viewport overlays. Welcome controls also occupy the right half on wide screens; the ship must remain legible around that panel rather than sit directly behind form fields. Export approval contact sheets with the current welcome, hero and sunset masks at 1440 × 1000, 820 × 1180, 390 × 844 and 320 × 700. Framing must survive `object-fit: cover`; adjust both the approved camera and CSS object-position together if necessary. Current player selects portrait at ≤639 CSS px; tablet uses the wide camera.

Freeze **both cameras, lenses, transforms, track curves and shot duration** in one camera-rig identifier. Day and sunset within each aspect ratio must have pixel-matched framing and motion. No lens/crop/ship-scale changes during lighting transitions. A subtle camera track may follow the ship only if it repeats seamlessly and matches in every lighting render.

## 3. Ocean, vessel and wake

Target calm but visibly living Caribbean water: approximately Beaufort 2–3, art-directed small waves around 0.15–0.45 m, restrained 3–5 m/s wind. These are production starting values, not assertions about a real sailing. Use resolved multi-scale surface displacement and micro-normal detail with changing highlights, water depth color, plausible roughness and dynamic reflections. Small crests must move relative to one another. No whole-frame warp, animated photograph or unrelated ocean footage behind a flat ship.

Start around 2–4 knots of vessel progression; solve or art-direct a coherent bow pressure wave, hull contact, stern prop wash and fading foam in the same simulation space. A tracked ship may remain compositionally centered while the surface, wake and reflections show its movement. Roll/heave must follow the low sea state and remain subtle. The hull must displace the surface; reflections/occlusion must respond to the actual hull. No sliding waterline, floating shadow, opaque wake ribbon or fixed foam sprite. Preserve correct scale relative to the ship.

Render the **ship, sky, water, reflection, island haze and wake together**. Separate AOVs are welcome for compositing within that same source scene, with coherent depth/reflection/shadow data. Independently generated plates or image-to-video morphs are unacceptable if ship architecture, glazing, waterline or wake changes incompatibly between frames.

## 4. Matched daylight and golden hour

Use the identical geometry, camera paths, ocean seed/cache and animation frame numbers for both states. As a starting point, daylight sun elevation is around 25°, golden-hour 3–5°, with coherent azimuth and plausible atmospheric scattering. Light the sky, sea, island, hull, glazing and foam from that actual sun/sky. Golden water reflections and warm vessel illumination must occupy physically credible directions. No orange overlay or sepia filter as a substitute.

Render scene-linear masters (EXR or equivalent) using one documented ACES/AgX color workflow. Apply a consistent display transform and deliver SDR BT.709, correctly tagged. Inspect highlights and dark hull detail on desktop and phone. Keep warm material response selective: white decks must retain neutral detail and navy must not become orange. Supply Migo/compass tint, rim color/angle, brightness, ground-shadow color/skew sampled or art-directed from each final light state. The manifest fields affect the illustrated character only; they must never grade the environment video.

## 5. Time, loop and encoding contract

Preferred loop: **8 seconds, 192 frames at constant 24 fps**. Supported contract: 6–16 seconds at constant 24 or 30 fps. Day and sunset for a camera must have identical dimensions, frame count, cadence, duration and phase origin. Frame n depicts the same geometry, camera and water simulation time under different lighting. Both begin at frame 0. Provide a frame correspondence/contact sheet at 0%, 25%, 50%, 75% and the seam.

Design a genuinely coherent loop: periodic water fields/camera and continuous wake dynamics, with no visible ship jump, foam reset, reversal, ping-pong, horizon wobble or morphed architecture. Review the seam at quarter speed and normal speed. A dissolve that hides a geometry jump is not acceptable. If reliable looping requires changing shot length, keep both lights matched and update the manifest.

| Delivery | Required |
|---|---|
| Review/master | High-quality ProRes/EXR sequence, both lights and cameras, plus source scene and dependencies |
| Wide web | H.264 MP4, 1920 × 1080 preferred; minimum 1280 × 720; max 6,000,000 bytes **per clip** |
| Portrait web | H.264 MP4, 900 × 1440 or 720 × 1280; max 2,500,000 bytes **per clip** |
| Optional alternative | VP9 WebM, identical frames/dimensions/fps/duration to corresponding MP4, same budget |
| Posters | WebP exported from frame 0 of each corresponding clip, distinct day/sunset files, same framing |
| Audio | **No audio stream at all** in any film. Migo/app sound remains separate and opt-in. |
| Encoding | Progressive, constant frame rate, H.264 yuv420p and faststart; SDR BT.709 primaries/transfer/matrix, no HDR metadata |

Serve files with correct content types, content length and HTTP byte-range support (`Accept-Ranges: bytes`, valid 206/Content-Range responses). Native phase matching requires seekable clips. Next's public-file server supplies these semantics; preserve them if media hosting changes.

Use high-quality encoding passes to meet budgets; do not conceal noisy water with blur. If these budgets cannot preserve accepted quality, provide side-by-side size/quality evidence and request a deliberate budget revision before enabling production media. Total transfer of a lighting pair is twice the per-clip budget; the player initially loads the daylight clip and activates the other on demand. No autoplay audio, external tracking CDN, blocking loader or navigation dependency.

## 6. Deliverable folder and manifest

Deliver source and large masters outside the public web folder. Include `README`, BOM, all texture/font/model/environment licenses, generation provenance if applicable, hashes, render settings, color transform, seeds/caches, camera-rig data and a change log. No unlicensed assets. Rights must permit web display, editing, derivative renders and commercial use. Document generated content as fictional; do not present it as actual destination imagery.

Web paths:

```
public/cinematic/film/manifest.json
public/cinematic/film/wide-day.mp4
public/cinematic/film/wide-sunset.mp4
public/cinematic/film/wide-day.webp
public/cinematic/film/wide-sunset.webp
public/cinematic/film/portrait-day.mp4
public/cinematic/film/portrait-sunset.mp4
public/cinematic/film/portrait-day.webp
public/cinematic/film/portrait-sunset.webp
```

Example **contract only**, not ready-to-publish metadata. Replace every identifier, rights reference, lighting sample, frame count and path with the actual approved delivery:

```json
{
  "version": 1,
  "status": "ready",
  "geometryId": "sha256:ACTUAL_APPROVED_CANONICAL_SCENE_HASH",
  "cameraId": "sha256:ACTUAL_FROZEN_WIDE_AND_PORTRAIT_RIG_HASH",
  "rights": "ASSETS.md#actual-delivery-and-license-record",
  "lighting": {
    "day": { "tint": "#fff4d6", "rim": "#ffffff", "shadow": "#053049", "compass": "#ffd27a", "brightness": 1.04, "rimAngle": 135, "shadowSkew": -8 },
    "sunset": { "tint": "#ff9a5a", "rim": "#ffb066", "shadow": "#2a0d2e", "compass": "#ffcf6e", "brightness": 0.95, "rimAngle": 135, "shadowSkew": 22 }
  },
  "desktop": {
    "width": 1920, "height": 1080, "frames": 192, "fps": 24,
    "day": { "mp4": "/cinematic/film/wide-day.mp4", "poster": "/cinematic/film/wide-day.webp" },
    "sunset": { "mp4": "/cinematic/film/wide-sunset.mp4", "poster": "/cinematic/film/wide-sunset.webp" }
  },
  "mobile": {
    "width": 900, "height": 1440, "frames": 192, "fps": 24,
    "day": { "mp4": "/cinematic/film/portrait-day.mp4", "poster": "/cinematic/film/portrait-day.webp" },
    "sunset": { "mp4": "/cinematic/film/portrait-sunset.mp4", "poster": "/cinematic/film/portrait-sunset.webp" }
  }
}
```

## 7. Acceptance, integration and remaining resources

First approve the vessel turntable/unseen-side contact sheet, then 3–5 second joint-rendered water/wake/light tests, then matched looping masters. Review paused frames and motion together: correct approved architecture, convincing water scale, changing reflections, grounded waterline, believable wake, identical scene between lights and clean seams. An artistically weak render does not become acceptable because file validation succeeds.

Run `npm run media:check` after adding real files. Its `productionMediaReady` flag means **technical delivery validation only**; visual approval is separate. Runtime also validates the manifest and video metadata. Then verify first-frame loading, phase alignment, the 750 ms transition after target readiness, rapid reversals, hidden/offscreen pause, reduced motion/manual pause, Save-Data, muted autoplay rejection, failed media, responsive crops and all primary navigation on a representative graphical browser. On a slow connection the target can buffer before the dissolve; do not claim activation-to-completion is always 750 ms.

Measure real-asset transfer, decode, dropped video frames, RAF intervals, long tasks and CLS on desktop and representative physical mobile hardware. Current fixture/still performance does not establish film performance. Capture a **new 20–40-second actual browser recording** showing natural moving water, vessel/wake, Migo greeting, homepage entry and real sunset lighting, plus desktop/tablet/mobile screenshots. Keep the PR in draft until visual approval. Never substitute engineering test patterns for that proof.

Missing resources are (1) a professionally authored, appearance-approved canonical Aurora Tide model/environment with coherent water/wake, (2) qualified CG look-development and rendering capacity or a proven video workflow capable of preserving this exact ship/scene across matched lights, and (3) the paired wide/portrait final film outputs and source/rights records. The available local CPU experiment failed the visual standard; the connected video-generation routes were unavailable. The interim generated still cannot supply these resources.

Migo's current approved poses, event-driven machine and contact-triggered opt-in sounds remain intact. A full turn/approach/limb performance requires the separated source art and animation deliverables specified in [MIGO_ASSET_PLAN.md](../MIGO_ASSET_PLAN.md). No new character rig, cabin, culinary, underwater or zipline production is claimed here. No merge or production deployment is authorized.

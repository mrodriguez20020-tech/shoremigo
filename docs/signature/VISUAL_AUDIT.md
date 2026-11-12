# Signature visual audit

**Result: the Phase 1.5 film does not meet the requested cinematic standard.** Passing functional tests did not establish visual quality. This audit supersedes the earlier Phase 1.5 presentation claims.

## Material reviewed

- The actual [31-second Phase 1.5 browser recording](../phase15/cinematic-demo.mp4), sampled through its opening, welcome, homepage and sunset.
- [Desktop welcome](../phase15/welcome-desktop.png), [desktop homepage](../phase15/home-desktop.png), [mobile homepage](../phase15/home-mobile.png) and [golden hour](../phase15/golden-hour-desktop.png).
- The original [ocean concept](../../public/cinematic/island-ocean.webp), [vessel concept](../../public/cinematic/aurora-tide.webp), previous `OceanScene.tsx` and its CSS animations at commit `000a837`.
- The approved eight Migo poses and [character source limitations](../MIGO_ASSET_PLAN.md).

## Visible findings

| Finding | Evidence and consequence | Required correction |
|---|---|---|
| The ocean is static inside the image | Whole-plate scale/translation moves identical wave features together. Small highlights never form, break or reflect a changing hull. This reads as a moving photograph. | Joint-rendered animated ocean displacement, microstructure, lighting and reflections. |
| Aurora Tide reads as a cutout | Its silhouette moves relative to the plate without displacement or water contact. There is no corresponding changing hull reflection. The ship and ocean have different apparent sharpness/depth. | Render the approved vessel in the same ocean/light/camera scene. |
| The wake is an overlay | The thin SVG wake stays graphic and detached from the wave field. It lacks pressure waves, foam variation, prop wash and reflected occlusion. | Coherent waterline, wake and foam in the same render. |
| Sunset is an image grade | The golden-hour plate becomes orange while the original photographic sky and reflection pattern remain. That is not the same environment under changed illumination. | Two renders of the same simulation frames and frozen cameras, with physically changed sky/sun and all matching reflections. |
| Apparent scene continuity is weak | Layer scale, placement and crops change across the welcome/homepage. Warm grading cannot disguise a separately positioned vessel. | A persistent media surface with a frozen framing contract and matched daylight/sunset files. |
| The mobile crop loses the establishing composition | Cropping a wide still leaves too little editorial space and compresses the ship/headline hierarchy. | A dedicated portrait camera, approved using the actual 320/390 px UI masks. |
| Migo remains an illustrated sprite | Two whole-body walking poses cannot show a continuous turn, approach, foot roll or articulated stopping. Shadows/contact sounds improve timing but do not create missing drawings. | Preserve the current honest implementation; commission the exact source layers/poses in the existing character handoff. |
| Decorative movement overstates progress | Animated layers and a grade are visible, but the underlying ship/water/light relationship remains static. The flat wake makes the result less convincing. | Remove the effects instead of adding further imitation movement. |

The local fonts, champagne accents, broad spacing and preference controls are a usable interface foundation. They cannot compensate for the absent environment production assets. Advanced cabins, culinary, reef and zipline scenes should wait for flagship visual approval.

## Production feasibility actually tested

The user confirmed that no approved external model or matched footage exists. Connected Drive searches for ShoreMigo/Aurora Tide found no additional source. Available video-generation routes were checked: the Weave/Figma account was not linked, and the connected Canva account did not offer video generation. No paid generation or account upgrade was attempted.

A CPU Blender 4.3.2 proof was authored locally with one vessel, displaced ocean, wake, cameras and two light states. The available environment has three CPU cores, no GPU and no OpenImageDenoise support in that Blender build. A 1100 × 660, 32-sample proof took approximately 49 seconds per frame. More importantly, its vessel proportions, water appearance and wake were visibly below the approved direction. It was **rejected**, not shipped as the hero or declared a production-ready 3D asset. Increasing samples alone would not solve its modeling/art-direction defects. The diagnostic scene and renders are local experiments under ignored `work/signature/`.

One integrated generated **still** was achievable. It provides a more coherent temporary composition and is identified as a concept still wherever used. It is neither moving water nor a matched sunset render, and it does not approve unseen vessel geometry. The approved original vessel concept remains the modeling authority.

## Implemented response

The old whole-image ripple, moving vessel cutout, SVG wake and orange scene overlay have been removed from the opening/home/sunset environment. A single persistent, silent native-video pair now supports real production delivery, phase alignment and a 750 ms crossfade. The public manifest remains `awaiting-production-media`, so the interim site deliberately displays the still. Engineering playback patterns used by tests are never public experience media.

**Visual acceptance remains blocked.** [The exact asset-production specification](ASSET_PRODUCTION_SPEC.md) defines the missing source scene, two-camera paired renders, rights and acceptance evidence. The new browser recording documents the interim implementation; it is not the requested moving-water proof.

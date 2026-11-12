# Original Migo renderer and asset boundary · WP-07

Codex implements; Claude independently reviews. Integration base: `000a837adfa8bf3ed39f05be61e09a4bc3f6df3e`. The scoped MigoStage placement fixes are carried forward from Codex WP-01 `8e2b296` without importing its environment/media work. WP-04 remains separate; no ship/cabin branch or character image changes.

## What the current renderer can do

Eight original 440×440 whole-body WebP poses, reflected facing, root translation, pose opacity transitions, scene-aware image compositing, controller-timed step contacts and opt-in synthesized sound. Cadence is a 200 ms anticipation plus three 460 ms steps; travel eases during recovery and holds during the contact portion. Lead feet alternate between odd-length bursts. A short held/dimmed orientation change softens discrete facing flips; it is **not** an authored continuous turn.

No articulated limbs, independent eyes/blinking, lip sync, actual per-foot deformation or production rig are present. Do not describe the available sprites as rigged animation. Original bytes and ownership are recorded in ASSET_MANIFEST.json and ASSETS.md; no derivative replacement mascot is introduced.

## Runtime contract

`rendererContract.ts` defines the versioned CharacterRenderState (mode, expression, pose, facing, size, contact, pause and surface). A future renderer consumes these presentation inputs; it never owns booking/payment state or emits financial success. The unchanged bus/reducer remain authoritative. Celebration stays limited to application `booking:verified` / `rescue:resolved` events emitted by verified service flows, never quotes, AI excitement or motion callbacks.

`sm:migo-contact` is observational evidence of a controller contact (foot, step, surface, travel). `sm:migo-motion` reports hop-start/landed and direction, enabling deterministic observation rather than a transient screenshot assertion. These are not payment events. Original `motion:contact` / `motion:landed` bus events continue to drive audio; audio requires explicit opt-in and remains suppressed for reduced motion, checkout/docking, hidden documents and underwater surfaces. Browser automation can validate scheduled Web Audio markers, not human audibility on a physical device.

## Geometry and control policy

`useAvoidanceZones` batches protected bounds into one cache. It invalidates on scroll, resize, protected-element size/DOM changes and dialog open/close. A bounded 900 ms settling interval follows transforms/reveals, at most12.5 geometry batches per second; stable walking consumes cached bounds. Geometry reads are not repeated for every walking frame. Exact interval candidates replace coarse 24 px sampling.

Compact placement tries both sides and safe vertical offsets. No safe space means the roaming character is temporarily visually hidden; the header's concierge access and page controls remain usable. It reappears after geometry becomes available. It does not sit on a protected control to satisfy a visibility requirement. Native modal content is not obstructed; background walking stops when a dialog opens.

Keyboard ArrowLeft/Right, Shift for a larger step, Home/End move a focused desktop companion through the same safe-placement rules. This remains available when animations are paused/reduced; movement is immediate. Pointer dragging still snaps safely on release. Enter/Space opens the original concierge. Visitor hide, pause, tips and opt-in audio remain intact.

## Contextual guidance

Optional, once-per-key route suggestions explain the dish guide, LastBoard timeline or booking verification. They are absent from checkout/operator, suppressed while docked, respect tips off and safe areas, and never assert a successful transaction or real supplier availability. A visitor must explicitly open the concierge; the existing server-side tool/verification boundary remains in force.

## Future production delivery

ProductionCharacterDelivery requires editable-source and runtime file hashes/rights, mappings for every existing MigoExpression, authored per-foot plant/lift markers and owner identity/appearance/contact-sheet approval. The source must supply hidden-joint artwork, contact landmarks and actual turn/blink/expression clips; none is inferred from these eight flat poses. Swap the renderer only after that delivery is independently reviewed. Do not weaken the reducer, financial gating, accessibility or audio consent to install a new renderer.

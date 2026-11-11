# Migo: asset boundary and next animation handoff

The eight original 440×440 transparent WebP poses remain untouched. `walk-a` and `walk-b` are flattened whole-body drawings, not separated left/right boot, leg, face or strap layers. They differ in limb position, body silhouette and medallion position. They are not sufficient for a continuous, fully articulated walk, independent blinking, lip sync or a physically exact head turn.

Phase 1.5 uses those two poses in **brief, low-distance stepping bursts**. One clock drives eased horizontal recovery, alternating artwork, stationary contact windows, scene-aware contact shadows and optional audio. The old whole-sprite vertical bob/rotation is removed from walking. Standing and contact frames hold position; long sliding loops are no longer used. The greeting reuses `think → walk-a → walk-b → wave`. No boots, eyes, mouth or crest are cut out, fabricated, warped or replaced with a generated mascot.

**True articulated walking was not achieved.** Two poses cannot describe the full transfer of weight, sole roll, leg passing, lift and follow-through. Recovery between the supplied poses remains visibly discrete and cannot guarantee anatomically exact planted-foot motion. The implementation should be reviewed as an honest limited-pose fallback, not a finished character rig. The browser recording is the evidence for its present quality. Contact labels identify alternating artwork phases; precise anatomical sole markers still require authored animation data.

## Required source artwork

For a faithful frame-based upgrade, author an eight-frame cycle of the same approved Migo: left contact, left compression, right passing, left lift, right contact, right compression, left passing and right lift. Provide each on the existing 440×440 transparent canvas, with a registered ground baseline and consistent scale, lighting, face, crest, compass medallion and boots. Supply both sole contact coordinates, the planted-foot interval and intended travel per cycle. Add anticipation, two stopping/settling frames, a neutral standing pose and authored turns to and from the viewer.

For a layered rig instead, supply original separated boots, lower/upper legs, pelvis, torso, arms/hands, head, eyes/lids, mouth, wave crest, compass strap and medallion, including the artwork hidden behind each joint. Define permitted deformations, joint pivots, foot IK targets and occlusion order. Blinking and facial motion should wait for these authored layers or approved expression frames.

Handoff should include contact markers, root displacement, surface tags, hop takeoff/landing markers and interruption boundaries. The existing event bus and the `gait.ts`/contact-audio boundaries can consume this data without changing booking or payment logic. Success animation remains gated by server-verified capture events.

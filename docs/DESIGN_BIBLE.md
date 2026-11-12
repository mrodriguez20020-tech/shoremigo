# ShoreMigo design bible

## Authority and scope

**Approved direction: Cinematic Luxury.** The owner's Signature Experience Overhaul and Professional Dual-Agent Execution directives establish the requirements below. This file consolidates that supplied intent; it does not assert that an unseen detailed design file has been recovered or approved.

The repository supplies Phase 1/1.5 reports, original Migo art, fictional vessel/ocean concepts and functional demos. WP-02 now supplies provisional design-control geometry and a cabin plan under review in PR #3; confirmed geometry/circulation defects prevent freezing it. It does **not** contain a complete approved scene storyboard, dimensional ship/cabin source, complete motion design or detailed future planner/slot specification. Those references remain explicitly missing. Resolve them through the owner before dependent design/model decisions; do not invent replacement designs. Existing implementation reports are historical evidence, not blanket visual approval.

## Visual language

Aim for a sophisticated, photorealistic Caribbean arrival, editorial hierarchy, generous negative space, restrained champagne/sea-glass accents and purposeful motion. The branch's existing navy (https://github.com/mrodriguez20020-tech/shoremigo/blob/8e2b2960155ae77ce431b87ef6f124c309102b12/docs/`#081e27`), ivory (https://github.com/mrodriguez20020-tech/shoremigo/blob/8e2b2960155ae77ce431b87ef6f124c309102b12/docs/`#f2eee5`), champagne (https://github.com/mrodriguez20020-tech/shoremigo/blob/8e2b2960155ae77ce431b87ef6f124c309102b12/docs/`#e8c895`), Fraunces display type and Manrope body type are the current implementation baseline, not a newly approved token specification. Maintain readability across actual media and device crops.

Use original/licensed assets with factual provenance. Aurora Tide, its sailing and demo venues are fictional. Atmospheric stock/generated imagery is illustrative and must never be offered as real destination, tour, venue, cabin or inventory evidence. Code MIT licensing does not relicense media. [ASSETS.md](../ASSETS.md) is the rights authority; [ASSET_REGISTRY.md](ASSET_REGISTRY.md) tracks readiness and requirements.

## Approved experience requirements

| Experience | Required outcome | Boundary |
|---|---|---|
| Arrival / welcome | Photoreal living ocean, Aurora Tide offshore, credible wake/reflections; expressive original Migo; headline and independent optional country/language; Begin exploring; coherent homepage entry | Short/skippable intro, no autoplay sound, accessible controls and opt-in storage; no moving-still substitute |
| Golden hour | The same world/camera/water phase under coordinated sky, water, vessel and Migo illumination | Target 650–800 ms after media is ready; natural scroll, reversal stability, reduced-motion fallback; no orange grade as environment lighting |
| Aurora Tide | Pearl-white architecture, deep navy hull, sea-glass detail, panoramic windows, tiered observation decks, boutique proportions | One definitive geometry used for all exterior/deck/cabin views; the concept image is not a verified dimensional model |
| Decks / amenities | Interactive consistent decks and onboard amenities, linked to the same vessel architecture | Existing diagram is a demo; authoritative geometry/deck plan still required |
| Cabin 7214 | Connected spatial bedroom, living area, bathroom and private balcony | One coherent source/floor plan and navigable spatial relationships; unrelated room images/four illustrations are not completion |
| Taste & Indulge | Photoreal dishes, immersive image expansion, interactive menus, drinks and desserts | Preserve working menus/catalog; verify subject/rights and demo/real venue disclosure; detailed transition/design reference missing |
| Reef | Immersive underwater environment and realistic above/below-surface entry | Matched scene/camera and water boundary; no mismatched image dissolve presented as immersion |
| Canopy / activities | Aerial rainforest/zipline, smooth canopy rise, waterfalls, nature and relaxation | Coherent approved cameras/assets; no invented destination or activity availability |
| Migo | Original character, faithful articulation, natural ground contact/footsteps, expressions, optional sound and environmental light | Preserve event bus/state machine and success gating; two flat walk poses remain an honest fallback until authored rig/source exists |
| My Trip (https://github.com/mrodriguez20020-tech/shoremigo/blob/8e2b2960155ae77ce431b87ef6f124c309102b12/docs/future) | Multi-experience itinerary planning | Existing booking/LastBoard/Trip Rescue remain functional; combined-conflict UX/data rules require an authorized specification |
| Departures (https://github.com/mrodriguez20020-tech/shoremigo/blob/8e2b2960155ae77ce431b87ef6f124c309102b12/docs/future) | Multiple departure-time inventory | Per-departure capacity, holds and transaction semantics require a separate authorized backend package |
| Whole product | Responsive, accessible, usable navigation, Gemini concierge, LastBoard, PayPal, bookings, inventory, rescue and operator controls | Do not rebuild or fake the working business systems |

## Asset and motion authority

`public/cinematic/aurora-tide.webp` is the approved exterior appearance reference. `island-ocean.webp` establishes the fictional environment identity. `signature-still.webp` is an interim integrated atmosphere study, not definitive architecture or film. Freeze one approved exterior model and camera rig before matched renders or future views. Keep geometry/camera identities and source/rights records.

Render the ship, ocean, wake, reflections and lighting in the same coherent scene. The preferred integration is optimized pre-rendered media with still/reduced-motion fallbacks. A heavyweight real-time simulation is not justified without visible quality and measurements. Full specification: [ASSET_PRODUCTION_SPEC.md](https://github.com/mrodriguez20020-tech/shoremigo/blob/8e2b2960155ae77ce431b87ef6f124c309102b12/docs/signature/ASSET_PRODUCTION_SPEC.md).

The current 750 ms player transition is an engineering capability, not evidence of a completed physical sunset. Buffering may precede the dissolve. With the public manifest pending, the environment and Migo remain in daylight. The original Migo rig boundary and required source are in [MIGO_ASSET_PLAN.md](MIGO_ASSET_PLAN.md).

## Explicitly missing detailed references

| Reference | Dependent package / decision |
|---|---|
| Approved final opening storyboard, wide/portrait composition and physically matched film | WP-01 final visual acceptance; the production spec gives review targets, not newly approved frames |
| Definitive dimensional exterior, unseen elevations, deck arrangement and source model | WP-02, all subsequent vessel views; do not extrapolate differently in separate packages |
| Corrected/approved Cabin 7214 floor plan, dimensions/material references, circulation and camera controls | WP-03; WP-02 supplies a provisional plan with confirmed entry/area defects, not an accepted spatial source |
| Complete culinary gallery/expansion/menu interaction spec and verified image set | WP-04; retain existing fictional sample content meanwhile |
| Reef entry and canopy-rise storyboards/camera tracks/environment sources | WP-05/06; do not invent a new visual identity |
| Separated original Migo art/rig or approved authored motion/expression frames | WP-07; no generated replacement character |
| Multi-item planner UX, transfer/conflict policy and departure/inventory specification | WP-08/09; no implied backend authorization |

Record resolutions in [DECISIONS.md](DECISIONS.md), with source and owner approval. The full product vision is known; these detailed production inputs are not supplied. Do not restart the overall design exercise or use their absence to hide achievable implementation work.

## Current owner design decisions · 2026-11-12

Aurora Tide's provisional design basis is **158 m, nine decks, 104 staterooms and approximately 208 guests**. The demo cabin is **7214, Premium Balcony Stateroom, Deck 7 port**, formerly 9214. Claude implements WP-02; Codex independently reviews. [PR #3 review at 414b627](https://github.com/mrodriguez20020-tech/shoremigo/pull/3#pullrequestreview-5869346197) requests corrections; its massing/plan does not establish production readiness or a completed cabin walkthrough.

Remove **Interior Staterooms, the conventional theatre and Kids' splash zone** from the planned boutique architecture/product migration. **Tidekeeper Suite is a future concept**, not currently available accommodation. A boutique entertainment lounge requires validated spatial allocation before it is represented as a located amenity. Existing ship/domain app code remains a historical demo until the assigned scoped migration; this document does not silently change that runtime.

Golden hour: desktop excursion card below copy within the left content region; keep the right vessel region clear and the same persistent camera across windows. Portrait/tablet copy/card follow a dedicated vista. Current safe areas and mandatory contact-sheet masks are in [the film production specification](https://github.com/mrodriguez20020-tech/shoremigo/blob/8e2b2960155ae77ce431b87ef6f124c309102b12/docs/signature/ASSET_PRODUCTION_SPEC.md#2-shot-and-framing).

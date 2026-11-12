# Implementation ownership and work packages

The integration foundation is `design/cinematic-luxury` at `000a837adfa8bf3ed39f05be61e09a4bc3f6df3e`, observed on 2026-11-12. It is an accepted functional foundation with a **rejected cinematic visual result**, not final visual approval. Production `main` was `630d0b251d8247fcd762ab676e5d06b79337d142`. Do not assume either ref stays fixed; fetch and record actual bases for new work.

Package states: **PARTIAL** (some implementation), **BLOCKED** (named dependency), **NOT STARTED**, **REVIEW PENDING**, **ACCEPTED** (all applicable gates approved). No current visual package is marked ACCEPTED. Reviewer names below are workflow roles, not fabricated GitHub review submissions. The project owner assigns unowned packages and dispatches Claude review.

## Matrix

| Package | Implementation owner | Independent reviewer | Dependencies | Current state | Branch / PR |
|---|---|---|---|---|---|
| WP-01 Signature environment/welcome | Codex | Claude — pending owner dispatch | Canonical visual source from WP-02; matched film; original Migo fallback (full rig later WP-07) | PARTIAL engineering; BLOCKED final film/visual acceptance | [`feat/wp01-cinematic-environment`](https://github.com/mrodriguez20020-tech/shoremigo/tree/feat/wp01-cinematic-environment) → `design/cinematic-luxury`; [draft PR #2](https://github.com/mrodriguez20020-tech/shoremigo/pull/2) |
| WP-02 Definitive Aurora Tide | Unassigned | Other agent after assignment; owner approves appearance | Original vessel concept; unseen-view/deck approval; qualified source-asset production | BLOCKED source model/approved detailed architecture; brief prepared | Planned `feat/wp02-aurora-tide`; no branch/PR yet |
| WP-03 Spatial Cabin 9214 | Unassigned | Other agent after assignment | WP-02 geometry + approved cabin floor plan/material/control reference | NOT STARTED; existing four illustrated views are a functional demo | Planned `feat/wp03-cabin-explorer`; no branch/PR |
| WP-04 Culinary experience | Unassigned | Other agent after assignment | Detailed approved interaction reference; verified/licensed subject images | NOT STARTED cinematic upgrade; guide/sample menus already work | Planned `feat/wp04-culinary-experience`; no branch/PR |
| WP-05 Reef environment | Unassigned | Other agent after assignment | Approved surface-entry storyboard + coherent reef assets | BLOCKED production references/assets | Planned `feat/wp05-underwater`; no branch/PR |
| WP-06 Canopy / activity environments | Unassigned | Other agent after assignment | Approved rise/zipline/activity storyboards + coherent media | BLOCKED production references/assets | Planned `feat/wp06-canopy`; no branch/PR |
| WP-07 Advanced Migo | Unassigned | Other agent after assignment; owner approves character | Original source layers/rig or approved complete authored frames | BLOCKED production source; original limited-pose behavior retained | Planned `feat/wp07-migo-rig`; no branch/PR |
| WP-08 Multi-experience My Trip | Unassigned | Other agent after assignment | Authorized UX/domain brief and integration of existing booking/LastBoard/rescue | DEFERRED; single-booked-trip functionality exists | Planned `feat/wp08-trip-planner`; no branch/PR |
| WP-09 Multiple departures/inventory | Unassigned | Other agent after assignment | Explicit backend authorization, slot/data/payment/rescue/migration design | DEFERRED; present single-departure inventory remains protected | Planned `feat/wp09-departures`; no branch/PR |
| WP-10 Integration/release verification | Codex for current WP-01 checks; release ownership unassigned | Claude for WP-01; full release reviewer to be assigned | Accepted package PRs, real assets, approved credential/device coverage | PARTIAL WP-01 regressions; release not authorized | Current checks in WP-01 PR; future `chore/wp10-integration-verification` not created |

Integration-to-main [draft PR #1](https://github.com/mrodriguez20020-tech/shoremigo/pull/1) is the historical Phase 1/1.5 proposal. It must not be used as evidence that the new package is integrated or visually approved. The current package is a separate review against integration, not a direct commit/merge there.

## WP-01 — signature cinematic environment and welcome

- **Scope:** `src/components/scene/{CinematicBackdrop,OceanScene}.tsx`, intro/welcome/home integration, `src/app/{layout,page}.tsx`, scoped global presentation, welcome CTA translations, `src/lib/cinematic/media.ts`, `public/cinematic/film/manifest.json`, interim still, related tests/QC/capture scripts and review/governance documentation. Existing preference semantics, original character/bus/machine/audio and protected server/domain/payment modules stay unchanged.
- **Assets:** A-01/A-02 concept authorities, A-03 temporary still, M-01 paired wide/portrait movie/source delivery, M-07 original character upgrade source (later). Requirements in the [production spec](signature/ASSET_PRODUCTION_SPEC.md).
- **Acceptance:** [ACCEPTANCE.md](ACCEPTANCE.md), WP-01 row. Native playback/fallback tests alone are not moving-water/physical-sunset acceptance.
- **Implemented:** one persistent silent video pair, validated delivery metadata, seek-aligned phase handoff, 750 ms transition, reversal cancellation, posters/error/autoplay handling, offscreen/hidden pause, reduced motion/Save-Data, honest static interim state; Begin exploring; removal of whole-image ocean motion, separate boat/wake and orange environment overlay.
- **Blockers:** no approved joint-rendered production source/film; local Blender proof rejected, connected generation routes unavailable; no full articulated Migo source. [Audit](signature/VISUAL_AUDIT.md).
- **Evidence:** current actual interim recording/gallery/performance and check results in [signature/README.md](signature/README.md); final genuine moving-water/sunset recording and actual-film performance still missing. Tests use marked engineering patterns only.

## WP-02 — definitive Aurora Tide architecture/exterior/deck assets

- **Scope:** canonical source scene and model delivery, `public/cinematic/` approved derivatives, model/texture rights records, geometry/camera contracts and future exterior/deck asset adapters. Existing `src/components/ship/ShipExplorer.tsx`/`src/lib/domain/ship.ts` are read-only demo references until a scoped implementation is assigned. Do not modify WP-01 playback or reimplement the hero.
- **Assets:** M-02 definitive model/elevations/deck arrangement, linked M-01 ocean/wake/light render source. Original A-02 appearance authority; A-03 is not geometry authority.
- **Acceptance/evidence:** owner-approved contact sheets/turntable/deck arrangement, reusable editable/interchange source, material/source/rights BOM and hashes, matching views/paired-water lookdev; criteria in ACCEPTANCE. Precise brief: [WP02_BRIEF.md](WP02_BRIEF.md).
- **State/blockers:** no canonical model, unseen-side/dimensional/deck design or production artist/render pipeline. Next independent package is prepared, not implemented or silently assigned.

## WP-03 — spatial Cabin 9214

- **Scope:** new cabin rendering/navigation module under `src/components/ship/`, `/ships` integration and approved cabin metadata. Coordinate with the ship-module owner before editing `ShipExplorer.tsx`; preserve its working accessible tabs/decks/amenities. No cabin sales or live cabin inventory.
- **Assets:** M-03 single connected bedroom/living/bathroom/private-balcony model or coherent panoramic spatial capture; approved floor plan and dimensions, materials, cameras/hotspots, ship exterior relationship.
- **Acceptance/evidence:** actual spatial continuity, approved geometry, accessible keyboard/touch/reduced-motion alternatives, walkthrough recording and payload/render metrics. Four unrelated pictures or existing vector views do not qualify.
- **State/blockers:** existing illustrative cabin demo works; authoritative plan/source/control specification and WP-02 geometry absent. No competing scene implementation begins.

## WP-04 — Taste & Indulge

- **Scope:** `/taste`, `src/components/dining/`, approved media/expansion UI and presentation tests. Read current `src/lib/domain/dining.ts` sample content; editing content/data requires the assigned package brief. Keep live food-tour inventory/reservation path and honest fictional sample menus.
- **Assets:** M-04 subject-verified/licensed dish, restaurant, beverage and dessert imagery with thumbnails/full images, focal metadata, alt/disclosure and source masters. Existing restaurant stock atmosphere is not food inventory evidence.
- **Acceptance/evidence:** owner-approved expansion interaction; focus/Escape/return, touch/keyboard menus, loading/reduced motion, alcohol/demo disclosures, responsive gallery and real transition recording, image budgets and food-booking regression.
- **State/blockers:** guide/menu/drinks/desserts already functional; cinematic detailed reference and approved subject image set missing. No invented partners, allergy assurances or venue identity.

## WP-05 — underwater environment

- **Scope:** a new isolated reef/surface-entry renderer and approved excursion-entry UI; integrate through existing scene/events/navigation contracts. No catalog availability, booking or water-safety promises introduced.
- **Assets:** M-05 coherent above/surface/below-water scene, matched camera/light, reef/sea-life source and physically credible water boundary, silent motion plus still fallbacks.
- **Acceptance/evidence:** approved entry storyboard, believable continuous entry/refraction/depth, navigable fallback; actual recording, responsive/accessibility/load/decode/frame checks and rights records.
- **State/blockers:** no production environment/storyboard; existing reef listings/vector art do not implement immersion.

## WP-06 — rainforest/zipline and other activity environments

- **Scope:** isolated canopy-rise/zipline environment and approved waterfall/nature/relax surfaces, preserving existing excursions and gentle-activity filtering.
- **Assets:** M-06 coherent forest/canopy/zipline camera path and activity-specific media, depth/light/environment source; location verification where named, illustrative disclosure otherwise.
- **Acceptance/evidence:** approved rise/zipline storyboard, smooth spatial continuity, useful reduced-motion/navigation fallback, responsive captures and actual browser motion/performance evidence. No unrelated image pan described as a spatial rise.
- **State/blockers:** no complete approved detailed storyboard or source environment; scope for waterfall/nature subscenes must be assigned explicitly.

## WP-07 — advanced Migo animation

- **Scope:** character renderer/pose mapping, authored motion/contact adapters and related interruption/audio/lighting tests. Coordinate ownership before editing `MigoStage`, `SpriteMigo`, `GreetingMigo`, gait/contact code. Keep bus/machine behavior and verified-success gating intact; no backend changes.
- **Assets:** M-07 separated original art/rig or approved registered frames, sole/contact/root-motion markers, turns, anticipation/settle, expressions and crest/strap/compass source; [MIGO_ASSET_PLAN.md](MIGO_ASSET_PLAN.md).
- **Acceptance/evidence:** faithful silhouette/design, authored articulation, planted feet, interruptible motion, synchronized opt-in sound, environmental light, reduced motion/mobile/docking/checkout and payment-gating regressions. State/contact sheets plus actual recording/source review.
- **State/blockers:** eight approved flattened poses available; no full rig, blink or continuous turn/approach source. Preserve the honest limited-pose fallback until delivery.

## WP-08 — multi-experience My Trip planner

- **Scope:** future `/trip` planner UI and separately authorized pure planning model/API boundaries. Existing Shore Pass, booking verification, recorded payment evidence and rescue remain usable. Do not conflate planned items with purchased/paid inventory.
- **Assets/references:** M-08 approved planner UX, item/transfer/conflict rules and estimate-versus-verified-price model; existing catalog/timetables only through approved boundaries.
- **Acceptance/evidence:** multiple add/remove items, deterministic overlap/transfer/port-window checks and actionable infeasible-plan explanations; domain/API/UI tests, responsive captures and protected booking/rescue regression.
- **State/blockers:** future scope; complete detailed UX/rules and explicit change authorization missing. Do not start backend implementation from this roadmap entry.

## WP-09 — multiple departures and inventory expansion

- **Scope:** future per-departure catalog/types, server holds/capacity, Postgres persistence/migration, payment booking association and operator/rescue integration **only after specific owner authorization**.
- **Assets/references:** M-09 approved departure/slot inventory design, migration/backfill/rollback plan, time zone/expiry/idempotency/concurrency/rescue policy. Not a visual placeholder exercise.
- **Acceptance/evidence:** atomic per-slot capacity/holds, correct expiry and no oversell, verified capture/refund/slot associations, operator authorization/audit, migration rollback; real database concurrency tests and full protected-service regressions.
- **State/blockers:** deferred; absent approved design/authorization. Current single-departure business systems stay unchanged.

## WP-10 — integration, accessibility, performance, security, release

- **Scope:** approved package integration review, route/device/accessibility matrix, test/evidence tooling and release checklist. No automatic release, dependency-breaking upgrade or production mutation is authorized.
- **Assets/dependencies:** accepted package revisions, final media and source/rights records, approved device/browser coverage and credentials for separately authorized provider checks.
- **Acceptance/evidence:** independently reproduced behavior, all protected regressions, measured real-media transfer/decode/drops/CLS, keyboard/reduced-motion and physical mobile coverage, relevant security/dependency/secret findings, documented known limitations and owner release decision.
- **State/blockers:** current WP-01 tests/evidence are a subset. No final-film benchmark, broad physical-device/screen-reader audit, current live provider revalidation or release approval is claimed.

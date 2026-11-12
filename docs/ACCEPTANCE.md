# Package acceptance and evidence

A package has separate **engineering**, **asset/visual** and **independent-review** gates. Passing tests does not satisfy visual acceptance. Pending requirements keep the package PARTIAL/BLOCKED; do not call it complete.

## Shared gates

- A scoped package branch and PR target `design/cinematic-luxury`, record its base SHA and owner/reviewer, and preserve other agents' work.
- Actual implementation changes, relevant meaningful tests, TypeScript, lint, production build and browser regressions. Record exact executed commands/results and warnings/skips. Use a fixed build while testing; no parallel browser suites or concurrent builds against that server.
- Desktop/tablet/mobile layouts, keyboard/focus/Skip, reduced motion/manual pause, optional audio, no interactive obstruction, no horizontal overflow and no material layout shift. Screen-reader/physical-device coverage must be stated accurately.
- New media has source, rights, disclosure, source/delivery format and optimization records. Production assets are visually approved; test patterns/rejected proofs are not substitutes.
- Screenshots of actual rendered states; 20–40-second actual browser recording for the signature animated feature; loading/frame/decode/CLS measurements appropriate to real assets. Label virtual display/viewport emulation and short samples honestly.
- Protected booking/payment/inventory/Gemini/LastBoard/rescue/operator/audit behavior remains verified. Offline/mock coverage is distinguished from current live API calls. Existing historical evidence and licensing are retained.
- Updated work matrix, handoff, assets, decisions and known defects. The independent agent reviews actual source and evidence. No self-approved merge, integration-to-main merge or production deployment.

## Package gates

| Package | Required visual / behavioral acceptance | Required evidence |
|---|---|---|
| WP-01 | Genuine moving water, changing reflections, believable Aurora Tide motion/wake; same world changes daylight/sunset; original Migo greeting; independent optional personalization, Begin exploring, usable fallback/navigation; 650–800 ms responsive dissolve once target is ready | Joint-rendered paired source/delivery, 20–40 s actual browser moving-water/sunset proof, four viewport captures, actual-film loading/decode/frame/CLS measurements, regression results |
| WP-02 | Approved faithful canonical exterior and deck/amenity architecture, one geometry identity across views and future rooms | Owner-approved elevations/turntable/deck sheet, editable source/interchange model, geometry/camera hashes, texture/rights BOM, joint-water lookdev, matching reference overlays |
| WP-03 | One connected Cabin 9214 with bedroom, living area, bathroom and private balcony; consistent ship/cabin geometry, accessible alternative controls | Approved floor plan/source, actual spatial navigation recording, viewpoints with transitions, keyboard/mobile/reduced-motion tests and measured payload/render performance |
| WP-04 | Licensed photoreal culinary assets, owner-approved image expansion, usable menus/drinks/desserts with accurate sample/real disclosure | Before/after expansion video, responsive/key/focus/menu tests, rights and image budgets; existing live food-tour path regression |
| WP-05 | Credible continuous surface-to-reef entry, matching water boundary/light/camera and usable navigation/fallback | Above/entry/below source match, actual browser recording, motion/accessibility/performance results, marine-media rights |
| WP-06 | Coherent canopy rise/zipline and approved waterfall/nature/relax presentation, believable depth and camera continuity | Source/camera review, actual transition recording, control/fallback/responsive/performance results, truthful location/activity labels |
| WP-07 | Faithful original character articulation, authored turns/expressions, planted feet/settle/contact timing and matching light; existing verified-event contract retained | Approved source layers/rig/frames with markers, state/contact sheets and real browser recording, interruption/audio/reduced-motion/docking/verification-gating tests |
| WP-08 | Authorized multi-item itinerary UX and deterministic conflicts/transfers/port-window checks, estimated and verified prices distinct | Approved spec; domain/service/UI end-to-end tests for multiple items and impossible plans; booking/rescue regressions |
| WP-09 | Authorized multiple departures with slot-owned capacity/holds, correct expiry, atomic concurrency, operator/audit and verified payment association | Approved data/migration/rollback spec, real Postgres concurrency/no-oversell tests, service/payment/rescue/authorization regressions |
| WP-10 | Integration review across approved packages, accessibility, real-asset performance, security and owner-controlled release readiness | Independent review record, route/device/accessibility matrix, protected-system regression and credential-aware API evidence, dependency/secret checks, explicit owner release decision |

## Current WP-01 verdict

Engineering integration is offered for review; **visual acceptance is BLOCKED**. The public film manifest is pending and the temporary environment is one concept still. The interim recording documents this limitation. No footage currently demonstrates the required moving ocean/wake/physical sunset. Required source art for full Migo articulation is also absent; current original limited poses remain.

`npm run media:check` intentionally exits 2 for the pending delivery. Its eventual success means technical file validation only, never aesthetic approval. Required final-film and source review is specified in [signature/ASSET_PRODUCTION_SPEC.md](signature/ASSET_PRODUCTION_SPEC.md). Exact current results are in [signature/VERIFICATION.md](signature/VERIFICATION.md).

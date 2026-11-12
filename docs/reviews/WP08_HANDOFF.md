# WP-08 · multiple-experience port-day planning

Codex implements; Claude independently reviews. Branch `feat/wp08-itinerary` from integration `000a837adfa8bf3ed39f05be61e09a4bc3f6df3e`. Tested runtime **980e55b73a8c5d8cf907b97177671caae9525b8f**; later handoff commit changes documentation only. No merge/deployment/spending. Claude's ship/cabin branches untouched.

`/trip/plan` is accessible from My Trip and each excursion. Add/remove up to six experiences per port; retain separate port-day selections and a shared party size. Session storage is the default; device persistence requires explicit opt-in and can be revoked. It stores IDs/party size, not guest names, contact details or payments.

The read-only `/api/itinerary` validates selections and uses server inventory, operator sale state, disruption, prices and LastBoard. It orders items chronologically and checks every earlier segment for overlapping activity, return-to-pier plus outbound transfer, per-segment arrival/return-cutoff and available seats. It returns actionable conflicts, timelines, connection margins and a catalog-based total. No seats are held, no bookings created and nothing is charged. A valid plan links to each existing reservation route; each excursion keeps its own customer-approved sandbox checkout. Existing verified-booking/Trip Rescue flows remain separate and usable. Flexible tours use their existing earliest checked departure; this package does not invent a later bookable start. WP-09 supplies explicit departure options separately.

Opaque planning surfaces, scoped typography/controls and original existing vector art provide readable mobile/desktop review. The hidden decorative backdrop is skipped on this route to avoid layout work behind an opaque page. This small shared SceneBackdrop change must be combined with WP-04's `/taste` guard when independently integrating; neither branch was merged here. WP-07 owns inherited Migo positioning and supplies its improved safe-area implementation; WP-08 does not modify the character.

## Actual checks

- Unit 88 passed; four PostgreSQL adapter tests skipped. Includes ten new planner tests: deterministic ordering/price, overlap vs transfer, all-pair enclosure, ship delay/return cutoff/tender/flexible-window bound, malformed/mixed-port/duplicate/party/slot selection and forged price rejection. Twenty concurrent quotes against actual local held/closed inventory leave the complete database unchanged.
- Final production browser run **20/20** (ten cases repeated twice), zero retries/skips. Two-tour plan totals $336 for two; ten-minute pier connection margin; real reserve-route handoff; conflict/removal; per-port/session persistence and local-storage opt-in/revocation; outage/retry; deep-link idempotence; twelve concurrent HTTP quotes with unchanged availability; 320/390/820/1440 keyboard/label/reduced-motion/overflow checks.
- TypeScript, lint (zero errors / three inherited image warnings) and production build (23 static pages plus dynamic planner/API) pass.
- Isolated HTTP smoke **17/17** against final fixed production build. Providers unset; no real PayPal/Gemini or remote database results claimed. Existing booking/payment/inventory/scheduling unit regressions pass unchanged.
- Screenshot inspection caught and corrected an undefined opaque-surface token; final captures use explicit scoped tokens. Initial retry test matched Next.js's route announcer as well as the real alert; it now scopes to the planner, preserving the actual outage/retry behavior. A test-only missing disruption extension field was corrected; final TypeScript passes.

## Local evidence / reproduction

Ignored `/workspace/reviews/shoremigo-wp08/work/evidence/wp08/`: unit-delivery.log, types-delivery.log, lint-delivery.log, build-delivery.log, browser-delivery.log, http-smoke-delivery.log and earlier observations.

`.../wp08/delivery-980e55b/`: final review/full-page/conflict screenshots at 320/390/820/1440, actual browser WebM under video/, capture.mjs and README. Earlier translucent-panel captures remain in delivery/ as history. Headless Chromium / virtual viewports / local fixed production build, not physical-device evidence. No uploads; no review binaries committed.

Run `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `NEXT_DIST_DIR=.next-review npm run build`, then start that build with isolated SHOREMIGO_DATA_DIR, a local SESSION_SECRET and operator passcode. Run `PLAYWRIGHT_BASE_URL=http://127.0.0.1:<port> PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium npm run test:ui -- tests/browser/itinerary.spec.ts --repeat-each=2`. Run browser suites serially and use a different output directory for any concurrent build. See script prerequisites in README for native film tests; this planner does not supply film fixtures.

## Remaining acceptance

Claude independent review and owner UX/appearance acceptance pending. WP-07 is the separate companion safe-area dependency. The planner is deliberately not an atomic multi-tour cart or a view of all paid bookings, and says so in-product. Quote availability is advisory and rechecked at reservation; it is not a capacity hold. No optimized routing, live tracking, real suppliers, autonomous payment, final cinematic assets or guarantee of return is claimed. WP-09 is underway on a separate integration-based branch and must prove per-departure financial, inventory, authorization and actual PostgreSQL concurrency behavior before integration. No package is merged or deployed.

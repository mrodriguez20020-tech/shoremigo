# WP-04 Taste & Indulge — implementation handoff

**Codex implements; Claude independently reviews.** Owner appearance acceptance remains pending. No merge/deploy/spending.

- Branch: `feat/wp04-taste-indulge`, direct integration base **000a837adfa8bf3ed39f05be61e09a4bc3f6df3e**.
- Tested runtime/assets: **e8e7b0078a1825381b98a0c6d4a0d5dacad7ad07**. Later handoff-only commits do not change that runtime.
- Logical commits: fcd1e6d (governance/WP-02 reconciliation), 08b2db6 (culinary implementation/media/tests), d8001da (SVG direction icons), e8e7b00 (skip hidden decorative backdrop). No WP-01 runtime stack/merge; its governance documents are an explicit documentation-only dependency.

## Delivered behavior

Five responsive sections, region-filtered dish discovery, three subject-verified licensed photographs, named dish expansion with 320 ms transform/dissolve, previous/next and keyboard navigation, native-modal background inertness, focus trap/Escape/opener restoration/scroll cleanup, reduced-motion and photo-error alternatives, contextual Ask Migo, roving menu tabs with per-tab panels and preserved source prices/tags, legal-age/demo/ingredient disclosures, and the actual server-owned food-tour→reserve→checkout path.

`MenuViewer` preserves its actual `venue` / optional `initial` API and works in `/ships`; no ship/cabin facts or source branch changed. The PR #3 coordination note's earlier “compact” wording was imprecise; the implementation preserves `initial`. Shared CSS is scoped to culinary classes. `SceneBackdrop` additionally skips `/taste`, whose opaque design supplies its own background; this avoids relighting invisible sun/glitter layers and preserves other routes.

## Exact checks and limits

- `npm test`: **81 passed; 4 PostgreSQL tests skipped** (PG_TEST_URL absent). Payment/AI service coverage uses doubles; no external provider success claimed.
- `npm run typecheck`: pass.
- `npm run lint`: pass, **0 errors / 3 inherited image warnings**.
- `NEXT_DIST_DIR=.next-wp04-delivery npm run build`: pass, **23/23 static-page generation**. The build directory is separate from running development/review servers. Next's generated tsconfig additions were restored; no generated build paths are committed.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3410 PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium npx playwright test tests/browser/culinary.spec.ts`: **14/14 final delivery pass**. Earlier fixed-build repetition: **28/28** at the preceding runtime before the SVG/hidden-backdrop fixes. Desktop/tablet/phone widths: 1440, 820, 390, 320.
- Local configured-isolation HTTP smoke: **17/17**. Test-only session/operator values; external PayPal/Gemini not configured. Correct $130 server total for two $65 Cacao guests; checkout honestly unavailable. An earlier misconfigured local run (no session/operator values) was 14/16 and is superseded, not hidden.
- Initial CLS before hidden-backdrop fix ≈0.32–0.34. Final measured **0.02025 (320), 0.02371 (390), 0 (820), 0 (1440)**. Remaining small mobile shift is inherited Migo placement, explicitly reserved for WP-07.
- Observed initial encoded photo bytes ≈151 KB phones / 203 KB tablet/desktop. 2400 px image loads on expansion. Assets retain responsive dimensions; no full gallery eagerly downloads. Local short-sample measurements are not physical-device, production-network or FPS claims.
- Actual browser recording: **31.20 seconds**, headless Chromium with emulated 1440×1000 viewport. No composited film or fabricated provider results.
- `git diff --check`, ignored-evidence and changed-file audit: pass. New binary review captures are outside Git. The integration baseline lacks WP-01's `evidence:check` npm script; ignored paths and staged changes were checked directly instead.

## Local evidence (preserved; no upload required)

All paths below are under ignored `/workspace/reviews/shoremigo-wp04/work/evidence/wp04/`:

- Final screenshots: `delivery/{hero,taste,dish,menu}-{320,390,820,1440}.png`.
- Recording: `delivery/video/page@fd9c40cda0668d512e563773ba041db6.webm`.
- Metrics and source/file hashes: `delivery/performance.json`, `delivery/manifest.json`.
- Logs: `browser-delivery.log`, `http-smoke-delivery.log`, `unit-delivery.log`, `types-delivery.log`, `lint-delivery.log`, `build-final-delivery.log`; copies also in `delivery/`.
- Capture recipe: `capture.mjs` and `delivery/capture.mjs`.
- Before screenshots: `before/taste-{390,1440}.png`. Initial trial captures/logs remain for investigation; `delivery/` is the final evidence set.
- ZIP: `wp04-delivery-e8e7b00.zip` — **17,404,678 bytes**, SHA-256 **112999ddb201aa22546dbb1265831ae0f4bb998d6fa50a35a1d5ac391a0bab4d**.

The interrupted Drive upload is not needed. Do not retry it, alter permissions or assert successful external publication. Claude can reproduce using the fixed build and committed test suite.

## Outstanding review / asset issues

- Claude's independent implementation review and the owner's appearance review are pending; these are not self-approved.
- Only doubles, jerk chicken and cochinita pibil have verified photographs. Other dishes/drinks/desserts retain clearly identified original illustrations. Complete photoreal culinary coverage is not claimed. Rights, source URLs, hashes and derivative terms are in ASSETS.md and public/culinary/credits.json.
- No real restaurant partners or restaurant reservation API; sample menu prices and dietary/alcohol tags remain unchanged. Food tour data stays server-owned. No live provider/database rerun in this package.
- Small inherited mobile Migo first placement remains for WP-07; no character change was mixed into WP-04 to remove it.

## Next package

Codex proceeds to **WP-07** in its own branch from the recorded integration baseline, preserving original art, event bus/state machine and verified-success gating. Its available-sprite renderer improvements must not claim an articulated rig. Claude remains independent reviewer. WP-08 itinerary / WP-09 departures follow with explicit backend regression and concurrency coverage under the owner's accelerated dispatch.

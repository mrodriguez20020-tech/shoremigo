> **Remediation update:** source `3c74658` supersedes the engineering findings below. See [the current reconciliation and final verification addendum](../reviews/WP01_REMEDIATION.md). Existing local gallery/video links remain historical snapshots at `a05d005`/`c64ace1`, preserved unchanged. New captures use versioned external review assets. Final cinematic media is still blocked.

# Signature environment — review status

**The requested cinematic moving-water result is not complete.** The missing deliverable is a joint-rendered Aurora Tide/ocean/wake environment with matching daylight and sunset footage. The current public manifest explicitly remains `awaiting-production-media`.

This branch removes the old moving-photo/cutout/overlay approximations and provides a professional integration path. One integrated fictional concept still is the temporary fallback. It does not animate, and golden hour currently retains that still. The [visual audit](VISUAL_AUDIT.md) explains the rejected results and actual tool limitations. The [production specification](ASSET_PRODUCTION_SPEC.md) defines exact assets, framing, timing, codecs, budgets, source/rights and visual approval.

## Engineering delivered

- A single persistent native-video pair shared by the brief intro, welcome, homepage and golden-hour window; no separate ship compositing or whole-image ocean animation.
- Local validated delivery manifest, shared geometry/camera identifiers, matched frame phase, 750 ms crossfade, cancellation on rapid reversal, silent playback and metadata checks.
- Optimized fallback still and controls available during buffering, failed media or autoplay refusal. No movie bytes requested with reduced motion or Save-Data. Films pause offscreen or in hidden tabs; manual motion pause also applies.
- Responsive wide/portrait delivery selection, optional VP9 with H.264 fallback, frame-zero posters and a CLI that checks real file metadata/rights/hashes/budgets. It intentionally exits 2 while production footage is missing.
- “Begin exploring” welcome action; separate country/language, opt-in storage, Skip, keyboard behavior, original Migo art and event-driven behavior remain. No backend/domain/payment/AI/operator changes.
- A separate sizing wrapper keeps the full original greeting visible on narrow screens; its scale no longer competes with the character's inline animation transform.

Native playback browser tests use **clearly marked FFmpeg test patterns** generated into ignored `work/`. Those fixtures verify browser mechanics only and are never served as public cinematic content. They are generated automatically when running the signature browser tests; system FFmpeg with libx264/drawtext is required.

## Current evidence

The [interim browser recording](evidence/interim-browser-review.mp4) is an actual headed Chromium session. **It is not the requested cinematic proof:** the ocean/vessel are a still, no matched sunset footage exists, and its audio is muted. It documents the current fallback, Migo welcome, preference controls, homepage and natural scrolling.

| View | Welcome | Homepage | Golden-hour section |
|---|---|---|---|
| 1440 × 1000 | [Desktop](evidence/welcome-desktop.png) | [Desktop](evidence/home-desktop.png) | [Desktop](evidence/golden-hour-desktop.png) |
| 820 × 1180 | [Tablet](evidence/welcome-tablet.png) | [Tablet](evidence/home-tablet.png) | [Tablet](evidence/golden-hour-tablet.png) |
| 390 × 844 | [Mobile](evidence/welcome-mobile.png) | [Mobile](evidence/home-mobile.png) | [Mobile](evidence/golden-hour-mobile.png) |
| 320 × 700 | [Narrow](evidence/welcome-narrow.png) | [Narrow](evidence/home-narrow.png) | [Narrow](evidence/golden-hour-narrow.png) |

[320 px preference controls, scrolled to Begin exploring](evidence/preferences-narrow.png).

[Measured browser evidence](evidence/performance.json) describes the actual environment and limits. The session uses headed Chromium on a virtual Xorg software display with viewport emulation, not a physical device or hardware-GPU benchmark. Still performance cannot establish final-film decode/frame performance. [Asset provenance](../../ASSETS.md).

## Reproduction and verification

Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. Start the production server with local test session/operator settings and an isolated `SHOREMIGO_DATA_DIR`, then run `npm run test:ui` and `node scripts/smoke.mjs http://127.0.0.1:3002 --operator-passcode=LOCAL_TEST_PASSCODE`. Database integration tests need a database; real PayPal/Gemini calls need sandbox/provider credentials. No live transaction is claimed.

Use `DISPLAY=:99 PLAYWRIGHT_HEADED=1 PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium PLAYWRIGHT_BROWSERS_PATH=/workspace/.playwright PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 node scripts/capture-signature-review.mjs` for the interim recording and screenshots, with a running Xorg display. Playwright's FFmpeg and system FFmpeg are required. This captures the actual public manifest, without injecting test films.

Final check counts and remaining limitations are recorded in [VERIFICATION.md](VERIFICATION.md). The design branch remains unmerged and undeployed. Later visual phases wait for flagship approval.

## Remediation evidence (3c74658)

[Settled six-viewport gallery, masks and 27.72-second actual recording](https://drive.google.com/drive/folders/16JQ68qmLUxMpvWY5WGU8yPgPt4Ixp0-S). Application/tests 3c74658; capture tool 3d9aa77 waits for welcome exit. [Exact final checks/limitations](../reviews/WP01_REMEDIATION.md). Historical gallery above stays unchanged; missing matched cinematic footage remains blocked.

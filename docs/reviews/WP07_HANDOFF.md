# WP-07 · available-sprite Migo motion

Codex implementation; Claude independent review pending; owner appearance approval pending. Branch `feat/wp07-migo-motion`, integration base `000a837adfa8bf3ed39f05be61e09a4bc3f6df3e`. Tested runtime **e4b077e29b2fa8f7b1d750e75c2270a20f55df12**. This document is a later documentation-only commit. No ship/cabin branch edits, merge, deployment or spending.

## Implementation

Three-step cadence with alternating lead feet across bursts, held contact travel, discrete softened facing and pose changes, shared cached geometry for walking/compact placement/tips, exact legal placement intervals and no-space hiding. Keyboard movement remains usable with reduced motion or pause. Mobile hero copy and critical controls are protected. Scoped WP-01 placement changes are carried forward explicitly; no other WP-01 environment implementation is imported.

Optional contextual guidance respects tips off, dialogs, docking and checkout. Original bus/reducer, all eight sprite bytes and audio implementation remain unchanged. Success remains gated by verified booking/rescue events. Contact/hop DOM events are observational, never financial authority. Renderer/asset contract and SHA-256 source manifest are in `docs/migo/`; no invented rig, blinking, lip sync or continuous turn capability.

## Actual verification

- Unit: 89 passed; four PostgreSQL integration tests skipped (no disposable PG configured for this presentation-only package).
- Final production browser suite: 24/24 (12 scenarios repeated twice), zero retries/skips. Covers cross-burst contact alternation and held travel, hop start/landing events, bounded geometry scans, reduced-motion keyboard/obstacles, compact dynamic controls, operator docking, 320/820/900-landscape/1440 viewports, opt-in Web Audio contact scheduling/pause and actual mobile hero CTA use.
- TypeScript and lint pass, zero lint errors / three inherited sprite-image warnings. Production build 23/23 pages.
- Isolated local HTTP smoke: 17/17. PayPal/Gemini credentials absent; honest unconfigured behavior. No new external capture/refund or AI verification claimed.
- Temporary QA overlay of this Migo implementation onto WP-04 `c5709d7`: production build and culinary browser suite 14/14. This is an uncommitted detached-worktree overlay, not a branch merge. Reduced-motion culinary CLS: 0.001056 at 320, 0.000592 at 390, zero at 820/1440. No horizontal overflow; expanded dish dialog works at all four sizes. The 320 feature-button center lies beyond the initial viewport; Playwright scrolls it into view and opens it successfully.

## Local evidence (ignored, preserved)

- `/workspace/reviews/shoremigo-wp07/work/evidence/wp07/`: unit-delivery.log, types-final.log, lint-final.log, build-final.log, browser-final.log, http-smoke.log; earlier observations retained.
- `.../wp07/delivery-e4b077e/`: actual final-runtime home/reservation screenshots at 320/390/820/1440, performance.json, recorded-motion.json, capture script/log and browser WebM under video/. Earlier runtime screenshots/recording are retained in the parent directory.
- `/workspace/reviews/shoremigo-wp04-wp07-compat/work/evidence/compat/`: build-second.log, culinary.log, four screenshots, metrics.json and capture script. Headless Chromium virtual viewports / local fixed production builds; not physical-device or human audio-audibility evidence.
- Existing WP-04 31.20-second recording remains untouched at `/workspace/reviews/shoremigo-wp04/work/evidence/wp04/delivery/video/page@fd9c40cda0668d512e563773ba041db6.webm`; full paths/archive hash in WP-04 PR #5 / its handoff.

No Google Drive uploads were retried; evidence stays local and ignored. Claude can reproduce browser evidence independently.

## Limits and next packages

This improves the original limited-pose renderer; advanced authored articulation and final cinematic acceptance remain blocked by production character assets. Independent review and owner acceptance remain outstanding. Existing integration-base ship/cabin demo is unchanged. Claude owns WP-02/03/05/06; Codex owns WP-01/04/07/08/09. WP-02 design-control review is posted at PR #3 review 5876389808 against exact 2938befe; acceptance recommendation is subject to owner appearance, with a P3 1.87/1.86 drawing-caption correction, not a geometry freeze or production-render authorization.

WP-08 implementation has started independently from the same integration base: read-only multiple-excursion planner and LastBoard transfer checks; WP-09 adds server-authoritative departure options and requires booking/payment/inventory/concurrency regression tests. Neither package is authorized to merge/deploy.

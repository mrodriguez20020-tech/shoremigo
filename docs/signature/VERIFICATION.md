> **Remediation update:** source `79173ba` supersedes the engineering findings below. See [the current reconciliation and final verification addendum](../reviews/WP01_REMEDIATION.md). Existing local gallery/video links remain historical snapshots at `a05d005`/`c64ace1`, preserved unchanged. New captures use versioned external review assets. Final cinematic media is still blocked.

# WP-01 verification · 2026-11-12 UTC

**Engineering checks pass; final visual acceptance is BLOCKED and independent Claude review is PENDING.** These are results for the actual source/assets whose digests are in [verification.json](evidence/verification.json). The handoff identifies the implementation commit containing them.

| Check executed | Result / scope |
|---|---|
| `npm test` | 84 passed; 4 Postgres tests skipped without `PG_TEST_URL` |
| `npm run lint` | 0 errors, 3 existing sprite `<img>` warnings in MigoStage/SpriteMigo |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; 23 generated pages |
| `npm run test:ui` against fixed production build | 25 passed, serial headed system Chromium on virtual Xorg `:99` |
| `node scripts/smoke.mjs http://127.0.0.1:3002 --operator-passcode=…` | 17/17 real local HTTP checks, isolated store; PayPal unconfigured, concierge offline |
| `npm run media:check` / recorded QC command | Expected BLOCKED, exit 2: matched production footage not supplied; [raw result](evidence/delivery-qc.json) |
| Protected boundary diff against `000a837` | No changes in API/server/domain/concierge/Postgres/payment, Migo bus/machine/renderers/audio/original art, or hackathon submission/demo script |

The browser suite retains preference consent/revocation, separate country/language, focus/Skip/Escape, blocked storage, responsive layouts, navigation/concierge, reduced/manual motion, Migo contacts/sound/interruption, touch/drag/keyboard avoidance and checkout docking. Seven native-media cases add pending fallback, real seek-aligned handoff/750 ms CSS transition, reduced-motion transfer avoidance, media/poster failure, reversals, Save-Data and autoplay refusal. Their procedural engineering patterns have genuine byte-range delivery and are **not cinematic assets**.

The prior gait check could miss a brief hold under polling. It now observes the real rendered contact event and measures the actual stage position during the hold. Keyboard checks wait for client placement/motion to settle. No original character art, machine, gait or audio behavior was rewritten to satisfy these checks. Screenshot inspection found and corrected mobile greeting clipping by separating responsive scaling from its inline animation transform.

## Actual current evidence

[Interim browser recording](evidence/interim-browser-review.mp4): **27.7 seconds**, H.264, 1280 × 888, 25 fps, no audio stream. It captures the actual public pending-media experience, Migo greeting, welcome entry, homepage, concierge and natural scrolling. **It does not show natural moving water or physically matched sunset; those production assets remain missing.** Recording output fps is not application fps.

[Responsive gallery](README.md#current-evidence) covers 1440×1000, 820×1180, 390×844 and 320×700 plus scrolled narrow preference controls. Captures were inspected; no accepted moving-film proof is claimed. The historical Phase 1.5 video remains available as rejected visual evidence.

## Measured interim performance

[Raw measurements](evidence/performance.json). Headed Chromium on managed Linux, three CPU cores, virtual Xorg software display, no GPU. Four viewport emulations, short 2.5-second RAF/long-task samples without recording or parallel-test/build overhead. These are not physical mobile or sustained GPU benchmarks. Poster loading uses localhost/cache, not a mobile-network profile; no production video decode was measured.

| Viewport | Mean RAF interval (ms) | Approx. callbacks/s | P95 (ms) | Raw layout-shift sum |
|---|---:|---:|---:|---:|
| 1440 × 1000 | 16.78 | 59.6 | 16.70 | 0.00015 |
| 820 × 1180 | 16.78 | 59.6 | 16.80 | 0.00048 |
| 390 × 844 | 17.01 | 58.8 | 16.80 | 0.03230 |
| 320 × 700 | 16.67 | 60.0 | 16.70 | 0.00455 |

All four samples reported zero horizontal overflow, zero >50 ms long tasks **during the sample**, zero film requests (manifest pending) and no captured browser page errors. The layout-shift values above are nonzero; do not claim zero CLS. They sum observed non-recent-input shifts from navigation through sampling, not a full-session Core Web Vitals score. Real-film network/decode/dropped-frame performance, physical-device stability and complete screen-reader coverage remain unverified.

## Remaining gates

Missing: canonical appearance-approved scene/model and genuinely moving matched wide/portrait daylight/sunset films, source/rights records and final real-asset visual/loop/performance approval. Full Migo articulation requires authored source from [MIGO_ASSET_PLAN.md](../MIGO_ASSET_PLAN.md). Exact delivery/resource requirements: [ASSET_PRODUCTION_SPEC.md](ASSET_PRODUCTION_SPEC.md).

No new live PayPal, refund, Gemini or database success is claimed. Historical provider evidence stays in [the append-only verification log](../VERIFICATION.md). No integration/main merge, production deployment or change to verified submission/payment flows was performed. Independent review must inspect actual source and evidence; green technical checks do not approve the cinematic result.

## Remediation evidence addendum

[Current exact results and performance](../reviews/WP01_REMEDIATION.md#final-engineering-verification--source-79173ba); [versioned gallery/recording](https://github.com/mrodriguez20020-tech/shoremigo/releases/tag/wp01-review-79173ba06c73). Application/tests 79173ba; capture tool 9872f1e. Final movie 27.68 s, silent H.264 1280×888 at 25 recording fps. No real moving-water/sunset media approval.

# Codex → Claude / owner handoff · WP-01

## Actual baseline and ownership

| Item | Observed state |
|---|---|
| Repository | `mrodriguez20020-tech/shoremigo` |
| Production branch reference | `main` = `630d0b251d8247fcd762ab676e5d06b79337d142`; no new deployment/runtime-commit verification |
| Integration base | `design/cinematic-luxury` = `000a837adfa8bf3ed39f05be61e09a4bc3f6df3e` |
| Package branch | `feat/wp01-cinematic-environment`, created directly from that base with all unfinished local signature work preserved |
| Working implementation/evidence commit | `a05d0053d1567e0275ced00d8ff3ed40624e1944` — source and actual captures; subsequent shared-instruction/handoff commits do not change application code |
| Package PR | Pending creation; will target `design/cinematic-luxury` as a draft |
| Historical integration-to-main proposal | [PR #1](https://github.com/mrodriguez20020-tech/shoremigo/pull/1); not current WP-01 integration/visual approval |
| Implementation owner / reviewer | Codex / Claude, independent review **pending owner dispatch** |

The initial working tree was dirty on integration at `000a837`; it contained the unpushed signature player, fallback concept, tests and partial asset handoff. Those changes were inspected and moved intact to the package branch, then stabilized and committed. No competing hero implementation was started. Remote refs were fetched, not inferred from the old reports. The old status log's deployment/main descriptions are historical snapshots; this table records the observed refs.

**WP-01 is PARTIAL/BLOCKED, not visually complete.** Genuine moving water, integrated wake/reflections and physically matched daylight/sunset footage cannot currently be demonstrated. No canonical approved source scene/model or final film was supplied; connected video-generation routes were unavailable and the local Blender proof failed the quality standard. Exact required resources and delivery are in [ASSET_PRODUCTION_SPEC.md](signature/ASSET_PRODUCTION_SPEC.md). The interim 27.7-second actual browser recording uses a static concept; it is not the requested moving-water proof.

## Design objective and implementation

Preserve Cinematic Luxury and the original character/preferences/business systems while providing an honest, usable integration for genuine future film. The production manifest stays `awaiting-production-media`; no QA pattern, rejected model, whole-image ripple, moving ship cutout or orange environment grade is used as finished cinematic content.

- One persistent native day/sunset video pair shared by intro, welcome, hero and sunset window; validated local manifest, geometry/camera/rights/lighting metadata and runtime media dimensions/duration.
- Native seek/phase alignment and 750 ms transition after target readiness, with rapid-reversal cancellation, mute enforcement, pause/visibility handling, reduced motion/Save-Data and nonblocking media/poster/autoplay fallbacks.
- Single integrated fictional concept still while source film is absent; Migo stays in its daylight too. Begin exploring copy, separate optional country/language, opt-in storage/audio, Skip and keyboard focus semantics retained.
- Mobile greeting sizing fixed with a separate unanimated scale wrapper. Original Migo art, bus, machine, gait, renderer and audio logic are unchanged.
- Procedural native-media test fixtures generated only in ignored `work/`, served with true HTTP byte ranges; rendered-event gait measurement replaces timing-sensitive polling. No protected backend/domain/payment/AI/transaction/submission changes.

## Actual changed modules

Implementation commit `a05d005` changes 44 files including evidence. Obtain the exact list with `git diff --name-status 000a837 a05d005`.

| Area | Files / purpose |
|---|---|
| Film integration | `src/components/scene/CinematicBackdrop.tsx`, `OceanScene.tsx`, `src/lib/cinematic/media.ts`, `public/cinematic/film/manifest.json` |
| Opening/home | `src/app/{layout,page}.tsx`, `src/app/globals.css`, `src/components/intro/Intro.tsx`, `src/components/prefs/WelcomePortal.tsx`, `src/lib/client/i18n.ts` |
| Media | `public/cinematic/signature-still.webp`; original concept and Migo files unchanged |
| Verification/tooling | `tests/cinematic-media.test.ts`, `tests/browser/{cinematic,phase15,signature}.spec.ts`, `playwright.config.ts`, `scripts/{check-cinematic-delivery,capture-signature-review}.mjs`, `package.json` script |
| Evidence/provenance | `docs/signature/`, `ASSETS.md`, supersession notice in `docs/CINEMATIC_PHASE_15.md`, current notice in `public/cinematic/README.md`; archived screenshots/video/script retained |
| Shared workflow | `AGENTS.md`, `CLAUDE.md`, design/work/acceptance/asset/handoff/decision documents, next WP-02 brief and additive README/status/verification context |

## Evidence and exact results

- [Actual 27.7-second interim browser recording](signature/evidence/interim-browser-review.mp4), muted H.264 at 25 recording fps; shows the current still environment, greeting, entry, concierge and natural scroll. **No final cinematic footage claimed.**
- [Desktop/tablet/mobile/narrow gallery](signature/README.md#current-evidence), including 320 px scrolled preference controls.
- [Verification and measured performance](signature/VERIFICATION.md), [raw source/recording digests](signature/evidence/verification.json), [asset hashes](signature/evidence/asset-hashes.json), [technical media blocker](signature/evidence/delivery-qc.json).
- [Visual audit of rejected Phase 1.5 and failed local production attempt](signature/VISUAL_AUDIT.md), [rights](../ASSETS.md), [character source limitation](MIGO_ASSET_PLAN.md).

Executed: **84 unit passed + 4 database skipped; 25 browser passed; 17/17 local real HTTP smoke passed; TypeScript/build passed; lint 0 errors with 3 existing sprite-image warnings.** `media:check` exits **2**, correctly blocked by missing matched production film. Provider doubles/offline HTTP checks do not revalidate live PayPal/Gemini; no current live provider/database success is claimed.

Headed Chromium on virtual Xorg software display, viewport emulation: short still-only samples approximately 59–60 RAF callbacks/s; no horizontal overflow or >50 ms sample long tasks; no page errors. Nonzero layout-shift sums include approximately 0.032 at 390 px. These are not physical mobile/GPU, production-video decode or full-session Core Web Vitals results.

## Independent Claude review requested

Claude should fetch the actual PR/head and reproduce its source/evidence review. No Claude runtime/tool channel or confirmed reviewer GitHub account is configured here, so this document **does not claim review happened**. The owner dispatches it; no external message or invented reviewer request was sent.

Review these specific risks/questions:

1. Native media lifecycle: source selection, HTTP seeking, phase alignment at the handoff, transition timing after readiness, reversal cancellation and promises/listener cleanup.
2. Hidden/offscreen/route cleanup, reduced/manual motion, Save-Data, silent autoplay refusal, bad metadata and missing poster/video behavior. Inspect actual source, not just seven fixture-based test results.
3. First paint/crops on mobile/tablet, the greeting wrapper, focus/Skip/consent, global CSS/layout effects on existing functional routes, and Migo control avoidance.
4. Full manifest versus technical ffprobe checks, rights/canonical identity and byte budgets. Confirm neither manifest readiness nor QA patterns are described as artistic acceptance.
5. Protected-system diff, no fabricated payment/AI/inventory state, no original character changes, no secrets/local stores or submission changes.
6. Actual recording/screenshots and performance limits. Keep the missing-film, Migo-source and physical-device/layout-shift limitations explicit. Review the shared instructions/matrix for inaccurate assumptions before adoption.

Report blocking findings with file/line, reproduction and impact, separate implementation review from visual approval, and return through the PR/owner. Do not silently edit the implementation owner's branch or merge it.

## Next package and release boundary

[WP-02 brief](WP02_BRIEF.md) is prepared for definitive Aurora Tide architecture/source assets. Owner/reviewer assignment, approved unseen geometry/deck references and a viable production source workflow are entry conditions. Planned branch `feat/wp02-aurora-tide` is **not created**. It must use the actual approved integration SHA and must not replace WP-01 playback. No cabin/culinary/reef/canopy/Migo-rig/planner/departure implementation was started.

All package code and shared documents remain proposals until independent review. No package merge into integration, integration merge into `main`, production deployment or submission modification occurred. Do not release the still fallback as a completed signature environment.

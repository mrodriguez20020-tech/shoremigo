# Cinematic Luxury · Phase 1.5

The opening now uses a fictional Aurora Tide concept vessel and island/ocean environment, reused across the intro, welcome, homepage, golden hour and Ships & Rooms discovery card. Golden hour relights that same geometry in **750 ms**. Migo keeps his original artwork and application behavior, with brief stepping bursts and optional contact-triggered sound.

**A fully articulated walk was not achieved.** The source has two flattened walking poses and no separated boots, legs, face or strap layers. The fallback uses those approved poses without fabricating a rig or distorting the character. Its remaining discrete recovery motion is visible in the recording. [Exact limitations and required assets](MIGO_ASSET_PLAN.md).

## Actual browser evidence

[31-second browser demonstration with app audio](phase15/cinematic-demo.mp4). It shows the establishing shot, welcome steps and wave, entry into the homepage, Aurora Tide, two stepping poses, chat hop/return, and natural scrolling into the same environment at golden hour. Audio begins only after explicit opt-in in the recording; no microphone or external soundtrack was used. Video is encoded at 25 fps; this is recording output, not a claim about application rendering speed.

| View | 1440px desktop | 820px tablet | 390px mobile | 320px narrow |
|---|---|---|---|---|
| Welcome | [View](phase15/welcome-desktop.png) | [View](phase15/welcome-tablet.png) | [View](phase15/welcome-mobile.png) | [View](phase15/welcome-narrow.png) |
| Homepage / Aurora Tide | [View](phase15/home-desktop.png) | [View](phase15/home-tablet.png) | [View](phase15/home-mobile.png) | [View](phase15/home-narrow.png) |
| Golden hour | [View](phase15/golden-hour-desktop.png) | [View](phase15/golden-hour-tablet.png) | [View](phase15/golden-hour-mobile.png) | [View](phase15/golden-hour-narrow.png) |

[First stepping pose](phase15/walking-left.png) · [Alternate stepping pose](phase15/walking-right.png) · [Narrow preference controls](phase15/preferences-narrow.png)

## Implemented

- Original generated fictional vessel asset with pearl-white superstructure, navy hull, sea-glass accents, dark panoramic glazing and tiered observation decks. The same transparent render is reused consistently; no real ship photograph is called Aurora Tide. [Asset foundation](../public/cinematic/README.md) and [rights records](../ASSETS.md).
- Restrained camera-depth movement, very slow vessel progression, a small composited wake, ocean texture movement and atmospheric light. This is lightweight 2.5D compositing of still media, not a live ocean simulation or a 3D vessel model. Mobile disables camera/cloud/water-layer animation while preserving the composition and slow ship progression.
- Brief `think → walk-a → walk-b → wave` welcome using unchanged character art, and a soft forward approach when leaving personalization. All country, language, remember, Skip/Escape, focus containment, storage-consent and reopening behavior remains.
- A single motion clock for two-step bursts, eased recovery, alternating poses, stationary contact windows and contact-shadow strength. The old vertical whole-sprite bob/rotation is removed from walking. A slow frame cannot skip directly past a contact; the burst completes before its idle recovery begins. The character stands on a restrained foreground companion lane rather than continuously sliding over the ocean.
- Original synthesized deck taps, padded cabin contacts, muted sand contacts and a single completed-hop landing. Contact sound is triggered only by a rendered contact; there is no repeating footstep loop. It is master-off on every visit and respects character/footstep toggles, zero volume, reduced motion, hidden tabs, docking and checkout. Underwater contacts are rejected. Interrupted hops cancel their pending landing.
- The manual pause setting and OS reduced motion stop the gait and ambient motion. Mobile uses a compact touch launcher rather than autonomous walking. Dragging, safe release, arrow-key movement, chat hop/return, event-driven reactions and checkout docking remain available.
- Scene selection prefers the section nearest the viewport center when active sections overlap, instead of depending on callback arrival order. Rapid scroll reverses the existing CSS interpolation smoothly. Migo's brightness, tint, rim and compass follow the same scene controller.
- Hero reading content has its own suggestion safe zone. A suggestion stays quiet when it would cover that content; the compact launcher continues to avoid controls independently.

## Performance and verification

[Raw performance evidence](phase15/performance.json) contains short requestAnimationFrame samples from headless system Chromium on managed Linux. These are viewport emulations, not physical device or hardware-GPU benchmarks. Mobile/tablet samples recorded no horizontal overflow, no layout shifts and no long tasks over 50 ms. Desktop measurement deliberately overlaps a walking burst. Sustained 60 fps on physical desktop hardware is not established by these samples.

| Viewport | Mean RAF interval | Approx. RAF rate | 95th percentile |
|---|---:|---:|---:|
| 1440 px (desktop) | 24.92 ms | 40.1/s | 33.4 ms |
| 820 px (tablet) | 17.36 ms | 57.6/s | 16.8 ms |
| 390 px (mobile) | 16.78 ms | 59.6/s | 16.7 ms |
| 320 px (narrow) | 16.67 ms | 60.0/s | 16.8 ms |

The desktop walking sample is about **40 RAF callbacks/second** in this headless environment; the 60 fps desktop target is not established. Phone/tablet samples are approximately 58–60 callbacks/second. These short measurements should not be treated as physical-device GPU results.

Final checks: **78 unit tests passed** (4 database tests skipped), **18 browser tests passed**, **17/17 HTTP smoke checks passed**, TypeScript passed, ESLint passed with the same three sprite-image warnings, and the production build passed. The browser suite includes the original eight checks plus motion/audio, rapid-scroll, native touch emulation at 390/320 px, drag/keyboard safe release and checkout docking. No browser errors were recorded during the demonstration/captures.

 Reproduce with `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, the existing HTTP smoke script and `npm run test:ui` against the running production build. `scripts/capture-phase15.mjs` records the actual application and responsive captures; it requires Playwright Chromium/FFmpeg and the system `ffmpeg` executable. Use `PLAYWRIGHT_BASE_URL`, `PLAYWRIGHT_CHROMIUM_PATH` and `PLAYWRIGHT_BROWSERS_PATH` as needed.

Business logic, API routes, original Migo assets and the payment-verification state machine are unchanged. Live PayPal sandbox and Gemini calls are not claimed without credentials. Postgres integration tests still require a configured database. No production deployment or merge is included.

## Remaining limitations and known defects

Two flattened poses cannot provide complete sole roll, limb passing, head turns, blinking or independent crest/strap follow-through. The current stepping recovery remains discrete; the contact holds and synchronized sounds do not turn it into an articulated rig. Mobile positioning prioritizes accessible controls; the compact launcher may float over decorative content when a control occupies the bottom edge.

The ocean and wake are composited visual approximations; there is no physical water/vessel interaction. Sunset is a grade of the same afternoon plate, not an astronomical sun simulation. The vessel is a single concept view, not a dimensionally consistent ship model or the existing cabin explorer's verified deck geometry. Future spatial rooms and new vessel angles require an authored model/design sheet.

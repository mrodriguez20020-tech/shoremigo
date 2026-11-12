# WP-01 review remediation · 2026-11-12

**Final visual acceptance remains BLOCKED.** The public manifest is `awaiting-production-media`. This remediation repairs engineering and composition around a disclosed static concept; it does not supply moving water, a production Aurora Tide model or matched sunset footage.

Claude reviewed `c64ace134e228403c11ece9e152a8a30faa66350` in [PR #2 review 5869121191](https://github.com/mrodriguez20020-tech/shoremigo/pull/2#pullrequestreview-5869121191): **APPROVE WITH CONDITIONS**, requiring the changes below. He independently ran Windows checks; 51/54 non-media repetitions passed, and native-media tests were not run without FFmpeg. Those historical results are separate from Codex's new Linux verification. The revised source needs Claude's independent re-review; this report is not his approval.

## Current PR #2 findings

| ID | Resolution / evidence |
|---|---|
| N1 · phase after native seek | Reproduced against previous build with a 120 ms delayed native setter: **175.6 ms** handoff error. Player now rechecks actual phase after seeking **and** play completion, uses observed signed error to compensate decoder/seek/play latency, and bounds seeks at three, followed if necessary by at most 600 ms of fine clock correction using playback rate on the still-invisible incoming film. Rate returns to 1 before dissolve and on cleanup. It only dissolves within one frame; otherwise retains the outgoing film (`alignment-blocked`). The first wall-clock compensation attempt failed a normal native case and was replaced. A later full headed run at 62d2d3f passed 38/39: a normal switch hit the safe alignment-blocked guard. The bounded fine correction resolves this decoder-startup jitter; neither failed revision is counted as a final green run. Native tests measure handoff against ≤1/24 s and annotate actual errors. |
| N2 · offscreen/hidden continuity | Reproduced the missing `is-visible` class after offscreen pause. Temporary visibility pauses retain the decoded frame and actual light; policy/accessibility/error fallbacks still use posters. Route teardown clears the retained-frame state. Tests verify offscreen and hidden pause/resume. |
| N3 · autoplay retry | Reproduced absent keyboard recovery. One pointer/key gesture invokes native play synchronously under browser user activation; one attempt only, listeners cleaned, stale promise canceled. Refusal still leaves navigation/poster usable. Native keyboard test verifies recovery; permanently refused playback keeps the fallback. |
| N4 · interim sunset/disclosure | `GoldenCopy` reads actual delivered cinematic lighting, with hydration-safe interim copy: “Stay for the evening.” The sunset claim appears only with sunset media/light. Disclosure reports concept still or illustrative cinematic scene as appropriate. Copy, disclosure and card are Migo avoidance regions. A further real proactive-tip check reproduced an already-open hero bubble over the golden subject; actual tip bounds are now rechecked before paint and during scroll/resize/reveals, with immediate hide/inert when unsafe. New 820/1440 cases cover the existing-tip scenario, including resize; creation also uses the clamped on-screen bubble bounds. |
| N5 · composition conflict | Owner accepted Claude's card-move direction. Desktop card is **below copy in the left content region**, not over the right vessel. Portrait/tablet editorial follows a dedicated vista. Same persistent camera across hero/golden. Updated production spec gives after-cover viewport masks, 90 px navigation and companion/disclosure reserves; tests measure disjoint geometry at six viewports. Final both-light film masks remain a delivery requirement, not fabricated proof. |
| N6 · lint outputs | Ignore `.next-*/**` and `work/**`. Lint checked with deliberately invalid generated JavaScript in an alternate `.next-*` probe; 0 errors, original three sprite-image warnings. Probe removed. |
| N7 · native prerequisites | README/AGENTS document Chromium, system FFmpeg/ffprobe, libx264/drawtext and byte-range fixtures. Missing binaries produce an explicit skip; skipped native coverage is not a pass. The final acceptance run uses installed executables. No new dependency or paid service. |

## Historical PR #1 findings reconciled

| Finding | Status / action |
|---|---|
| H1 · incompatible home / explorer vessel | **Assigned dependency remains:** Claude WP-02 PR #3; Codex reviewed actual `414b627` with REQUEST CHANGES. Owner provisionally selects 158 m, nine decks, 104 staterooms/~208 guests and Cabin 7214 on Deck 7. No independent WP-01 ship/domain redesign. Existing explorer facts await the scoped migration; this is not reported fixed in product. |
| H2 · flaky hop/keyboard/contact assertions | Chat-hop test observes and stores actual rendered mode/hop mutations before the action. It asserts that the hop occurred, rather than polling a 700 ms transient. Keyboard test waits for placement and stable rendered geometry; control clearance polls geometry rather than a fixed sleep. Existing contact event test retained. |
| H3 · phone launcher covers hero/CTA | Actual hero eyebrow/headline/subtitle/tagline now mark avoidance. First-paint placement is measured before visibility. Phone/short-landscape launcher avoids marked text/controls vertically; desktop standing resnap checks scroll/resize and exact viewport edges. Tablet gutter increased after a real failing layout case, rather than weakening the clearance test. Before/after reproduction found overlap at 320/390 before, none after at sampled positions. |
| H3b · greeting scale | Existing 90 px mobile greeting wrapper retained; no replacement art. |
| H4 · removed proof line | Owner-authorized quiet, localized LastBoard timing / PayPal Sandbox / AI verified-tool proof restored. Existing detailed working-system proof and PortDayClock remain. No live-provider success claim added. |
| H5 · evidence Git footprint | Historical committed binary snapshots preserved exactly. New captures go under ignored `work/evidence` and versioned review-only GitHub artifacts, with source/hash manifest. `evidence:check` rejects new/overwritten docs binaries; negative probe tested. No history rewrite or claimed reclamation of existing Git bytes. |
| H6 · golden card over vessel | Resolved through N5 and the owner's left-region decision; the separate full-width support-strip experiment was superseded before final capture. |
| H7 · initial x=24 jump | Owner's remediation scope authorizes this fix: layout-time viewport placement plus hidden-until-ready launcher. First-visible measurements check the actual initial frame, not just a later settled position. |
| H8 · first IO entry stale claim | Select the latest matching target entry by timestamp and process final enter/exit, including out-of-order callbacks. A controlled enter+exit batch previously left shade; corrected tests yield day. |
| H9 · greeting language mismatch | EN/ES/FR/PT plain greetings share the same intent. Independent country-aware variants remain separate; no country→language coupling. |
| H10 · unused stock ship | Removed unreferenced `public/images/ship.webp` from runtime tree; original source/license and immutable archived URL preserved in ASSETS. Aurora Tide/Migo authority files unchanged. |
| H11 · per-frame gait layout reads | **Deferred to WP-07**, measured impact negligible in the review. Gait/bus/machine/audio and original art remain unchanged. No speculative animation refactor to close this low-priority item. |

Previously withdrawn claims about non-element scene claims and an unreproduced desktop performance regression are not reopened as defects.

## Design-control review and next package

[PR #3 independent review](https://github.com/mrodriguez20020-tech/shoremigo/pull/3#pullrequestreview-5869346197), anchored at **414b62713cb174265e29f15667418feb56904d6f**, requests correction of entry obstruction, inconsistent views/GLB, detached glazing, invalid normals/triangles, identity holes, tapered-module fit and dimensional/area/numbering metadata. Independent overlay reproduced **89.84%** silhouette IoU; generator files reproduce byte-identically. [Small audit record](WP02_414b627_AUDIT.json). No active Claude branch edits, final modeling approval or production-quality claim.

Shared references now use Cabin 7214/nine decks/104 staterooms/~208 guests and Claude implementation/Codex review. Owner removes Interior Staterooms, conventional theatre and Kids' splash from the planned migration. Tidekeeper Suite is a future concept; the boutique entertainment lounge needs spatial validation. [WP04_BRIEF](../WP04_BRIEF.md) prepares the next independent Taste & Indulge implementation without starting its source changes.

## Verification and evidence

The final exact source SHA, repeat results and immutable artifact links are recorded in the following verification addendum after the fixed-build runs. Earlier 31-case runs occurred before N1–N4 remediation and are not evidence for the final revision. Native fixtures are procedural QA patterns; screenshots/recording use the actual public pending manifest. No production film decode, physical mobile, screen-reader or live-provider/database success is inferred.

The intermediate native/placement source `ea170d0` passed 39/39 in three consecutive headed runs and one headless run (156 tests, no retries/skips/flakes; handoff errors 1.6–32.8 ms). A subsequent proactive-tip check found the already-open bubble obstruction, so those are retained as intermediate results rather than claimed as final bubble-remediation coverage. The final repeated suites include that case.

## Final engineering verification · source 79173ba

Exact tested application/tests source: **`79173ba06c73b0743cd19f960e326fcdfd2e5741`**. Subsequent changes affect capture readiness and documentation/evidence only, not application/tests. The capture tool at 9872f1e waits for the welcome overlay to detach before hero screenshots. The production build was fixed throughout the following runs. [Machine-readable results](WP01_VERIFICATION.json).

| Check | Actual result |
|---|---|
| Full headed Chromium regression ×3, serial, no retries | **41/41 + 41/41 + 41/41 = 123 passed**; 0 skipped, unexpected or flaky |
| Final-source focused headless existing-tip cases | **2/2 passed** (820/1440; open tip → resize/scroll) |
| Native phase measurements in the three final runs | **2.099–41.2 ms**, within one 24 fps frame (41.667 ms); delayed-seek cases **2.099–36.6 ms** with the injected 120 ms setter delay |
| Unit/service suite | **84 passed, 4 Postgres skipped** without PG_TEST_URL |
| TypeScript | pass |
| ESLint | **0 errors, 3 original sprite-img warnings**; alternate generated-dir negative probe ignored correctly |
| Production build | pass; 23 generated pages |
| Isolated real HTTP smoke | **17/17**; local file store, PayPal not configured, Gemini offline, operator protected; no live external-provider success claimed |
| Missing native executables probe | **1 explicitly skipped** selected native case with PATH excluding FFmpeg/ffprobe; not counted as native playback verification |
| Production media QC | expected **exit 2**, productionMediaReady=false, production film missing |
| Evidence guard / whitespace / capture-script syntax | pass; historical binary snapshots preserved |

The final three full runs were Linux system Chromium on virtual Xorg :99, with three CPU cores and no GPU. Headed/headless are modes in this OS, not separate physical platforms. Claude's Windows results belong to the earlier c64ace1 revision. The intermediate ea170d0 headless 39/39 result is retained separately; it is not reported as a full headless run of the final tip guard. Current source is ready for Claude's independent re-review, not merged or self-approved.

Actual captures, frame/mask metadata, sizes, SHA-256 and immutable artifact URLs are recorded in [WP01_EVIDENCE.json](WP01_EVIDENCE.json) and the following evidence addendum. The recording uses the public pending manifest, not fixture injection. Performance is still-only viewport emulation, not real-film/physical-device verification.

## Settled capture / immutable evidence

[Review-only artifact release](https://github.com/mrodriguez20020-tech/shoremigo/releases/tag/wp01-review-79173ba06c73) · [27.68-second muted actual browser recording](https://github.com/mrodriguez20020-tech/shoremigo/releases/download/wp01-review-79173ba06c73/interim-browser-review.mp4) · [complete archive](https://github.com/mrodriguez20020-tech/shoremigo/releases/download/wp01-review-79173ba06c73/wp01-review-evidence.zip) · [hash manifest](https://github.com/mrodriguez20020-tech/shoremigo/releases/download/wp01-review-79173ba06c73/evidence-manifest.json). Capture tool **9872f1e1234cc6e77604d84996ffe9449113f2f6** waits for the welcome overlay to detach; application/tests remain **79173ba06c73b0743cd19f960e326fcdfd2e5741**. Early unpublished captures caught the exit fade and were regenerated before publication, rather than described as settled hero evidence.

Key previews: [desktop golden layout](https://github.com/mrodriguez20020-tech/shoremigo/releases/download/wp01-review-79173ba06c73/golden-hour-desktop.jpg), [390 px hero/launcher](https://github.com/mrodriguez20020-tech/shoremigo/releases/download/wp01-review-79173ba06c73/hero-launcher-mobile.jpg), [mobile golden editorial](https://github.com/mrodriguez20020-tech/shoremigo/releases/download/wp01-review-79173ba06c73/golden-editorial-mobile.jpg), [320 px preferences](https://github.com/mrodriguez20020-tech/shoremigo/releases/download/wp01-review-79173ba06c73/preferences-narrow.jpg). Gallery/masks cover all six required viewports. Final both-light/all-language film contact sheets still require actual production assets. The interim still is not a validated production camera/geometry composition.

Final 2.5-second still-only samples: **59.6–60.0 RAF callbacks/s**, p95 intervals **16.7–16.8 ms**, 0 sample long tasks, no overflow or page errors, 0 film requests. Raw non-recent-input shift sums are nonzero: about 0.00015 desktop, 0.00048 tablet, **0.05014 mobile**, **0.04639 narrow**, 0.00003 short desktop and 0.00785 landscape phone. These are short localhost/virtual-display measurements, not full-session Core Web Vitals or production-video/physical-device benchmarks.

Logical payload **4,801,326 bytes**, slightly above the preferred 4 MB to preserve six-viewport states, masks and one actual recording. ZIP **4,680,318 bytes**; direct files and archive are duplicated for review convenience on existing GitHub storage. No binary review evidence added to Git; historical snapshots remain byte-identical. [Full source/size/SHA-256 index](WP01_EVIDENCE.json).

Claude independently advanced WP-02 to 4a3bd65056f4918bb395f9215f3f7ae0cd3ab29c while this package finished. The posted review is of 414b627; the subsequent reconciliation is **not independently verified or approved here**. Its follow-up review and reported two tapered-balcony decision remain next review gates, in addition to production-source resources and owner appearance approval.

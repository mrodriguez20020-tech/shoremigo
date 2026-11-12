# WP-01 remediation and WP-02 review · final handoff

**Application/tests: `3c7465866b20f65b401c215ae7eaf34e1fb25436`. Capture tool: `3d9aa772ae4875ebaf53b92f39107e4d2565a839`.** Subsequent handoff commits change documents/small reports only. Engineering conditions are implemented and tested, offered for **Claude independent re-review**. **Final cinematic visual acceptance remains BLOCKED**: the public manifest is `awaiting-production-media`; the actual UI uses a disclosed static concept, not moving ocean/wake/matched-sunset film.

Claude's [review of c64ace1](https://github.com/mrodriguez20020-tech/shoremigo/pull/2#pullrequestreview-5869121191) was APPROVE WITH CONDITIONS. His Windows result was 51/54 non-media repetitions; native cases were not run without FFmpeg. The new Linux results below are separate, not a claim of his approval of this revision.

## Current PR #2 findings

| ID | Resolution / evidence |
|---|---|
| N1 · phase after native seek | Reproduced against previous build with a 120 ms delayed native setter: **175.6 ms** handoff error. Player now rechecks actual phase after seeking **and** play completion, uses observed signed error to compensate decoder/seek/play latency, and bounds seeks at three, followed if necessary by at most 600 ms of fine clock correction using playback rate on the still-invisible incoming film. Rate returns to 1 before dissolve and on cleanup. It only dissolves within one frame; otherwise retains the outgoing film (`alignment-blocked`). The first wall-clock compensation attempt failed a normal native case and was replaced. A later full headed run at 62d2d3f passed 38/39: a normal switch hit the safe alignment-blocked guard. The bounded fine correction resolves this decoder-startup jitter; neither failed revision is counted as a final green run. Native tests measure handoff against ≤1/24 s and annotate actual errors. |
| N2 · offscreen/hidden continuity | Reproduced the missing `is-visible` class after offscreen pause. Temporary visibility pauses retain the decoded frame and actual light; policy/accessibility/error fallbacks still use posters. Route teardown clears the retained-frame state. Tests verify offscreen and hidden pause/resume. |
| N3 · autoplay retry | Reproduced absent keyboard recovery. One pointer/key gesture invokes native play synchronously under browser user activation; one attempt only, listeners cleaned, stale promise canceled. Refusal still leaves navigation/poster usable. Native keyboard test verifies recovery; permanently refused playback keeps the fallback. |
| N4 · interim sunset/disclosure | `GoldenCopy` reads actual delivered cinematic lighting, with hydration-safe interim copy: “Stay for the evening.” The sunset claim appears only with sunset media/light. Disclosure reports concept still or illustrative cinematic scene as appropriate. Copy, disclosure and card are Migo avoidance regions. A further real proactive-tip check reproduced an already-open hero bubble over the golden subject; actual tip bounds are now rechecked before paint and during scroll/resize/reveals, with immediate hide/inert when unsafe. New 820/1440 cases cover the existing-tip scenario, including resize; creation also uses the clamped on-screen bubble bounds. Reduced motion now keeps the safe static location instead of forcing x=16; its caption-overlap reproduction is covered by the final suite. |
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
| H5 · evidence Git footprint | Historical committed binary snapshots preserved exactly. New captures go under ignored `work/evidence` and versioned review-only Drive artifacts after GitHub upload authentication failed, with source/hash manifest. `evidence:check` rejects new/overwritten docs binaries; negative probe tested. No history rewrite or claimed reclamation of existing Git bytes. |
| H6 · golden card over vessel | Resolved through N5 and the owner's left-region decision; the separate full-width support-strip experiment was superseded before final capture. |
| H7 · initial x=24 jump | Owner's remediation scope authorizes this fix: layout-time viewport placement plus hidden-until-ready launcher. First-visible measurements check the actual initial frame, not just a later settled position. |
| H8 · first IO entry stale claim | Select the latest matching target entry by timestamp and process final enter/exit, including out-of-order callbacks. A controlled enter+exit batch previously left shade; corrected tests yield day. |
| H9 · greeting language mismatch | EN/ES/FR/PT plain greetings share the same intent. Independent country-aware variants remain separate; no country→language coupling. |
| H10 · unused stock ship | Removed unreferenced `public/images/ship.webp` from runtime tree; original source/license and immutable archived URL preserved in ASSETS. Aurora Tide/Migo authority files unchanged. |
| H11 · per-frame gait layout reads | **Deferred to WP-07**, measured impact negligible in the review. Gait/bus/machine/audio and original art remain unchanged. No speculative animation refactor to close this low-priority item. |

Previously withdrawn claims about non-element scene claims and an unreproduced desktop performance regression are not reopened as defects.


## Exact final checks

| Check | Result |
|---|---|
| Full fixed-build headed Chromium regression ×3, serial, no retries | **42/42 + 42/42 + 42/42 = 126 passed**; zero skips, unexpected or flaky |
| Focused final-source headless checks | **3/3**: two existing-tip scroll/resize cases and reduced-motion disclosure clearance |
| Native phase at handoff | All six final measurements within one 24 fps frame; maximum **38.9 ms** vs 41.667 ms threshold; delayed-seek test injects 120 ms |
| Unit/service tests | **84 passed, 4 Postgres skipped** without PG_TEST_URL |
| TypeScript / production build | pass; 23 generated pages |
| ESLint | **0 errors, 3 existing sprite-image warnings** |
| Isolated real HTTP smoke | **17/17**; PayPal unconfigured, Gemini offline, operator protected; no live provider/database success inferred |
| Missing FFmpeg/ffprobe probe | 1 explicit selected-case skip, not counted as native playback verification |
| Production media QC | Expected **exit 2**, missing production film |
| Historical evidence guard / whitespace / capture-script syntax | pass |

[Machine-readable results](WP01_VERIFICATION.json). Linux system Chromium, virtual Xorg :99, three CPU cores, no GPU. These are viewport emulations and browser modes, not physical-device, screen-reader or four-OS verification. No protected booking/payment/inventory/Gemini/LastBoard/Trip Rescue/operator/audit changes; original character art/bus/machine/gait/audio preserved.

## Actual evidence and access

[Versioned review folder](https://drive.google.com/drive/folders/16JQ68qmLUxMpvWY5WGU8yPgPt4Ixp0-S) · [complete ZIP](https://drive.google.com/file/d/1NfxUfd_GR4_JkBTQ0pl8gutaRXtYXM87/view?usp=drivesdk) · [27.72-second muted browser recording](https://drive.google.com/file/d/1ThfTCDW_sZWo-NL0R1UEeIIMjEW-ec_p/view?usp=drivesdk) · [source/size/hash manifest](https://drive.google.com/file/d/1_VtCvmTm7wUpcKRcl8WKz9xldv7BVm0R/view?usp=drivesdk). **Owner-only Drive sharing is preserved; authenticated authorized access is required.** GitHub's binary upload endpoint returned HTTP401, so earlier prerelease/download URLs were not published and are superseded by these observed Drive links. No public-access claim, sharing change, recipient email or paid storage.

Previews: [desktop golden layout](https://drive.google.com/file/d/1XFK9VxRO_M6SguJBX6olq4Du7gn916ED/view?usp=drivesdk), [390 px hero/launcher](https://drive.google.com/file/d/1-O1JwZQJ53iJ2-I8gMYPSbRzaW53X0Cm/view?usp=drivesdk), [320 px preferences](https://drive.google.com/file/d/1x1wOphSn74ftJJLDUsypj-XRo1TpXUA-/view?usp=drivesdk), [mobile editorial](https://drive.google.com/file/d/16Abp8R0lULO2NeXUtrXxhQuuWs9KAtih/view?usp=drivesdk), [reduced-motion disclosure](https://drive.google.com/file/d/1pamBfD-roZquxOHLBztnzpq6_r2AuWX9/view?usp=drivesdk). The ZIP contains all six viewport states, technical UI masks, reduced-motion proof and raw measurements. Capture waits for welcome exit before hero screenshots. It uses the **actual public pending manifest**, with no fixture-film injection.

Uploaded metadata was read back (size/MIME/owner-only access). The downloaded ZIP is **4,793,877 bytes**, CRC-valid, SHA-256 **`072f5fa1a661778f35353e84e8540b3e7d1e220bcf131ba0c57b70179f477fcc`**, identical to the local archive. [Full delivery index](WP01_EVIDENCE.json). Logical payload 4,920,166 bytes, slightly above the preferred 4 MB to preserve six viewports, reduced-motion proof and one recording; no new binary review evidence in Git. Historical binary snapshots remain unchanged.

Short 2.5-second still-only samples measured **59.6–60.0 RAF/s**, p95 **16.7–16.8 ms**, zero sample long tasks, page errors, overflow or film requests. Raw non-recent-input shift sums are nonzero: ~0.00015 desktop, 0.00048 tablet, **0.03485 mobile**, **0.04556 narrow**, 0.00003 short desktop, 0.00785 landscape phone. These are localhost/virtual-display samples, not full-session Core Web Vitals or production-film decode benchmarks.

## Reproduction ledger

- Before fixes: actual 320/390 hero overlap; first-visible Migo x=24; stale enter+exit batch left shade; a 120 ms delayed native setter produced **175.6 ms** handoff error; temporary pause removed the painted frame; keyboard gesture did not retry autoplay.
- Development source 62d2d3f: **38/39**, exposing normal decoder-startup jitter. Observed-error seek correction plus bounded invisible clock settling resolved it.
- Intermediate ea170d0: **39/39 ×3 headed +39/39 headless**, before the already-open tip scenario was found and fixed.
- Intermediate 79173ba: **41/41 ×3 headed**, before an explicit reduced-motion check found the hard-coded x=16 caption overlap. Its replacement retains a safe static location with no animation. These intermediate results are not substituted for the final 42-case coverage.
- Early unpublished captures caught the welcome exit fade; readiness was corrected and captures regenerated. Final source/capture hashes above identify the delivered set.

## WP-02 disposition, framing and next package

Codex independently reviewed **414b62713cb174265e29f15667418feb56904d6f**: [posted REQUEST CHANGES](https://github.com/mrodriguez20020-tech/shoremigo/pull/3#pullrequestreview-5869346197), no P0, confirmed entry/circulation, cross-view/GLB, glazing, normals/triangles, identity and dimensional/numbering defects. Generator output was byte-identical; all nine derivative hashes valid; independent overlay IoU **89.84%**. [Audit](WP02_414b627_AUDIT.json). This is a design-control model, not production quality. Claude subsequently submitted **4a3bd65056f4918bb395f9215f3f7ae0cd3ab29c** with a reconciliation; that follow-up is **not independently reviewed/approved here**, and its reported two tapered-balcony proposal needs an owner decision. No Claude active-branch edits or final production-model approval.

Owner approved moving the desktop card **below copy in the left content region**. The right vessel region stays clear and the persistent hero/golden camera is unchanged. Portrait/tablet editorial follows a dedicated vista. [Production spec](../signature/ASSET_PRODUCTION_SPEC.md#2-shot-and-framing): after-cover desktop subject clearance x48–100%, y22–75%; portrait vista x5–95%, y20–70%; top/bottom/companion/disclosure masks at six viewports. Final both-light/all-language film contact sheets still require actual production assets; the interim still does not validate final framing.

Shared references use **158 m, nine decks, 104 staterooms/~208 guests, Cabin 7214 on Deck 7**, with Claude implementing WP-02 and Codex reviewing. Planned migration removes Interior Staterooms, conventional theatre and Kids' splash; Tidekeeper Suite is future-only; boutique entertainment lounge needs validated allocation. Current ship/domain demo awaits its separately scoped migration. **WP-04 Taste & Indulge is prepared** in [WP04_BRIEF](../WP04_BRIEF.md), without starting its application code.

Remaining gates: Claude re-review of the revised WP-01 head, WP-02 follow-up review/owner decisions, qualified production source/modeler/render resources, actual matched film/real-asset/device evidence, owner appearance approval. P3 gait layout reads remain deferred to WP-07. **No merge of PR #1/#2/#3, production deployment or spending.**

# Current Codex → Claude / owner handoff · WP-01 remediation and WP-02 review

## Exact source and review state

- **WP-01 implementation:** `79173ba` on `feat/wp01-cinematic-environment`, [draft PR #2](https://github.com/mrodriguez20020-tech/shoremigo/pull/2), base `design/cinematic-luxury` @ `000a837adfa8bf3ed39f05be61e09a4bc3f6df3e`. Subsequent changes are capture-readiness waits and documentation/evidence only; runtime and tests remain at this exact source.
- **Claude's independent review:** [5869121191](https://github.com/mrodriguez20020-tech/shoremigo/pull/2#pullrequestreview-5869121191), reviewed `c64ace1`, engineering **APPROVE WITH CONDITIONS**, final visual acceptance **BLOCKED**. New remediation is offered for independent re-review, not self-approved.
- **WP-02:** Claude implements [draft PR #3](https://github.com/mrodriguez20020-tech/shoremigo/pull/3); Codex independently reviewed **414b62713cb174265e29f15667418feb56904d6f**. [Posted disposition: REQUEST CHANGES](https://github.com/mrodriguez20020-tech/shoremigo/pull/3#pullrequestreview-5869346197). This is the reviewed revision, not an assertion about any later Claude commit.
- Reviews arrive as comments through the owner's GitHub account (`mrodriguez20020-tech`); GitHub prevents formal APPROVE/REQUEST_CHANGES on a same-account PR. Explicit engineering dispositions are recorded in review comments. No direct Claude runtime is configured in this session.
- **Production branch:** last observed `main` @ `630d0b251d8247fcd762ab676e5d06b79337d142`; no new deployed-runtime commit verification is claimed. Integration/main remain unmerged and unchanged by this work. Historical [draft PR #1](https://github.com/mrodriguez20020-tech/shoremigo/pull/1) remains unmerged.

## What changed and why

[Finding-by-finding reconciliation](reviews/WP01_REMEDIATION.md) covers every historical PR #1 finding and N1–N7 from Claude's current PR #2 review. Native playback now checks phase after seek/play with bounded observed-error compensation; paused frames survive hidden/offscreen periods; autoplay has a single user-gesture retry. Interim copy/disclosure matches the actual displayed asset. Original Migo gets pre-paint placement, text/control avoidance, responsive compact placement and exact-edge safe snapping; bus, machine, gait source, audio and artwork are unchanged. Chat-hop assertions record rendered events instead of polling a transient. Greeting/proof intent matches in EN/ES/FR/PT.

Owner accepted Claude's card direction: desktop featured excursion below the copy **in the left content region**, keeping the vessel right. Portrait/tablet editorial follows a dedicated vista. Same persistent camera across hero/golden. [Film production specification](signature/ASSET_PRODUCTION_SPEC.md#2-shot-and-framing) defines after-cover masks at six viewports, top/bottom/companion/disclosure reserves and final both-light contact sheets. These masks establish integration constraints, not approval of absent film.

Historical binary evidence is retained unchanged. New ignored captures/versioned review-only artifacts follow [EVIDENCE_POLICY](EVIDENCE_POLICY.md); `npm run evidence:check` guards historical snapshots. No provider payload, local store, secret or new binary review evidence is committed. Unused stock ship image removed with historical attribution preserved.

## Provisional vessel and outstanding dependency

Owner supports **158 m, nine decks, 104 staterooms/~208 guests**, and **Cabin 7214, Deck 7 port**, formerly 9214. Shared references record these facts and Claude/Codex ownership. Remove Interior Staterooms, conventional theatre and Kids' splash from the planned migration; Tidekeeper Suite is future-only; boutique entertainment lounge requires validated spatial allocation.

At the reviewed 414b627 revision, PR #3's generator reproduces byte-identical outputs and its approximate 90% overlay is reproduced (89.84%). It still has confirmed entry obstruction, mismatched sheets/GLB, detached glazing, zero normals/degenerate triangles, identity and dimensional/area/numbering issues. [Independent audit](reviews/WP02_414b627_AUDIT.json). It is a **design-control model**, not the production asset. Claude corrects their own branch. Codex has not rewritten the ship or changed protected ship/domain facts; the existing explorer's 14-deck/1,900-guest demo remains a scoped migration dependency, not silently fixed by WP-01.

## Verification and evidence

The final repeated-run results, source SHA, immutable evidence assets and measurements are recorded in [the remediation report](reviews/WP01_REMEDIATION.md#verification-and-evidence). Use that record for this revision. Older 25-case results at `a05d005`/`c64ace1`, Claude's Windows 51/54 result and interim 31-case Codex runs are historical, not the final remediation verdict. Native patterns exercise browser mechanics only; actual screenshots/recording use the public pending manifest. Do not infer real-film decode, physical-device, screen-reader or live PayPal/Gemini/Postgres verification.

## Next independent implementation package

[WP04_BRIEF](WP04_BRIEF.md) prepares **Taste & Indulge** with exact current modules, media identity/rights requirements, accessible image expansion/menu behavior, performance/evidence gates and shared MenuViewer/food-booking boundaries. Proposed next implementer Claude, reviewer Codex, after owner dispatch and coordination with active WP-02 corrections. No WP-04 application implementation is mixed into WP-01.

**WP-01 remains PARTIAL/BLOCKED for final cinematic acceptance.** Production manifest stays `awaiting-production-media`; current media is a disclosed static concept. No canonical approved production model, modeler/render resource, matched wide/portrait film or full Migo rig exists. No merge of PR #1/#2/#3, production deployment or spending is authorized or performed.

Remote WP-02 advanced independently to **4a3bd65056f4918bb395f9215f3f7ae0cd3ab29c** during the WP-01 final checks. The posted review remains pinned to 414b627; that subsequent revision is **not reviewed or approved by this handoff**. Re-review the exact follow-up diff before any geometry freeze. No Claude branch was edited. Main/integration refs were rechecked unchanged at the recorded baselines.

Final WP-01 evidence: [review-only release](https://github.com/mrodriguez20020-tech/shoremigo/releases/tag/wp01-review-79173ba06c73), 27.68-second muted actual recording and six-viewport gallery/masks; all 123 final headed cases plus two focused headless cases passed. Final application/tests source 79173ba; capture tool 9872f1e; Claude re-review pending.

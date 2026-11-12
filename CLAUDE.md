# Claude entry point

Read [AGENTS.md](AGENTS.md) first. It is the shared engineering policy for both agents. Then read [the current handoff](docs/HANDOFF.md), [work ownership](docs/WORK_PACKAGES.md), [design bible](docs/DESIGN_BIBLE.md), [acceptance gates](docs/ACCEPTANCE.md), [asset registry](docs/ASSET_REGISTRY.md) and [decisions](docs/DECISIONS.md).

Codex implements WP-01; Claude independently reviewed `c64ace1` in [PR #2 review 5869121191](https://github.com/mrodriguez20020-tech/shoremigo/pull/2#pullrequestreview-5869121191): engineering APPROVE WITH CONDITIONS, visual acceptance BLOCKED. Codex is correcting those conditions; the new revision needs independent re-review. Reviews arrive through the owner's GitHub account, so GitHub prevents formal APPROVE/REQUEST_CHANGES on same-account PRs; explicit dispositions are posted as review comments. No direct Claude runtime is configured in this Codex session.

Claude owns WP-02 PR #3; Codex's independent review of `414b627` is [REQUEST CHANGES](https://github.com/mrodriguez20020-tech/shoremigo/pull/3#pullrequestreview-5869346197). Do not edit the other implementation owner's active branch.

For the WP-01 review:

1. Fetch the package PR and compare its actual head against the base SHA recorded in the handoff. Verify the diff instead of relying on its narrative.
2. Inspect the actual browser recording/screenshots and the public pending-media manifest. Confirm the still/QA patterns are not presented as finished cinematic footage.
3. Review video lifecycle, seeking/phase handoff, reversal cancellation, muted autoplay, poster failure, visibility, reduced motion, Save-Data and route cleanup. Reproduce checks independently and record what actually ran.
4. Check preference consent, keyboard focus, Skip, responsive layouts, original Migo behavior and all protected business boundaries. Do not change those systems to make a visual test pass.
5. Report blocking defects with file/line evidence, reproduction and impact. Separate implementation approval from the still-missing film's visual approval.
6. Return findings through the PR/owner handoff. Do not rewrite the owning branch or merge it. If assigned implementation of another package, use its isolated branch and record ownership first.

The next independent implementation package is [WP-04 Taste & Indulge](docs/WP04_BRIEF.md). Its preparation authorizes no competing vessel/cabin implementation, spending, merge or production deployment.

# Claude entry point

Read [AGENTS.md](AGENTS.md) first. It is the shared engineering policy for both agents. Then read [the current handoff](docs/HANDOFF.md), [work ownership](docs/WORK_PACKAGES.md), [design bible](docs/DESIGN_BIBLE.md), [acceptance gates](docs/ACCEPTANCE.md), [asset registry](docs/ASSET_REGISTRY.md) and [decisions](docs/DECISIONS.md).

The owner's workflow pairs one implementation owner with one independent reviewer. Codex owns the current WP-01 implementation. Claude's WP-01 review is **pending**, not completed by this document. There is no configured Claude execution channel or confirmed GitHub reviewer account in this session; the owner dispatches this handoff. Do not mistake self-review, automated checks or another model's output for Claude approval.

For the WP-01 review:

1. Fetch the package PR and compare its actual head against the base SHA recorded in the handoff. Verify the diff instead of relying on its narrative.
2. Inspect the actual browser recording/screenshots and the public pending-media manifest. Confirm the still/QA patterns are not presented as finished cinematic footage.
3. Review video lifecycle, seeking/phase handoff, reversal cancellation, muted autoplay, poster failure, visibility, reduced motion, Save-Data and route cleanup. Reproduce checks independently and record what actually ran.
4. Check preference consent, keyboard focus, Skip, responsive layouts, original Migo behavior and all protected business boundaries. Do not change those systems to make a visual test pass.
5. Report blocking defects with file/line evidence, reproduction and impact. Separate implementation approval from the still-missing film's visual approval.
6. Return findings through the PR/owner handoff. Do not rewrite the owning branch or merge it. If assigned implementation of another package, use its isolated branch and record ownership first.

The next prepared package is WP-02 (canonical Aurora Tide architecture/source assets). Its exact asset brief is [WP02_BRIEF.md](docs/WP02_BRIEF.md). No WP-02 implementation owner or start approval is implied by this handoff.

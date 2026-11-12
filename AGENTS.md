# ShoreMigo shared engineering instructions

Applies to Codex, Claude and other repository agents. The project owner's current instructions take precedence. This file is the common workflow; `CLAUDE.md` adds the independent-review entry point without duplicating policy.

## Read before changing anything

Read `docs/HANDOFF.md`, `docs/WORK_PACKAGES.md`, `docs/DESIGN_BIBLE.md`, `docs/ACCEPTANCE.md`, `docs/DECISIONS.md` and `docs/ASSET_REGISTRY.md`. Consult `README.md`, `ASSETS.md`, `docs/STATUS.md` and the append-only `docs/VERIFICATION.md` for functional and licensing history. Inspect `git status`, current commit, remote refs and open PRs. Reports are evidence at a point in time, not proof of the current working tree.

## Branches and ownership

- `main` is the protected production/submission branch. Do not change the verified hackathon submission or deploy production without explicit owner approval.
- `design/cinematic-luxury` is the cinematic integration branch. No direct package commits, unreviewed merges or competing component rewrites.
- Start each package branch from the actual recorded integration commit: `feat/wpNN-description`. Record the base SHA in its PR and handoff. Do not branch from another agent's unmerged package unless that dependency is explicit and approved.
- One implementation agent owns each package. The other independently reviews its **actual diff and evidence**. Check the work matrix before editing shared modules; request a scoped handoff through the project owner instead of silently overwriting another agent's work.
- Preserve uncommitted work. Isolate it on the owning package branch before new implementation. Never discard, reset, force-push or rewrite another agent's changes.
- A PR is reviewable work, not approval. Resolve findings on the package branch. Do not merge until independent review and owner authorization; do not merge the cinematic integration branch into `main` or deploy as part of these packages.
- “Claude review pending” means pending. A Codex self-review or internal check is not a Claude review. Do not invent reviewer identities or claim an agent has run tools it has not run.

## Design and assets

Cinematic Luxury is the approved direction. `docs/DESIGN_BIBLE.md` records the known requirements and explicitly missing detailed references. Do not invent substitute designs to fill those gaps.

Preserve the original Migo artwork and event-driven contract. Keep separate optional country/language selection, opt-in persistence, Skip, keyboard access, reduced motion and opt-in audio. Financial success animation must remain gated by verified application events.

Realistic water requires genuinely changing surfaces/reflections and a believable integrated vessel/wake. Whole-image motion, a flat ship cutout, an orange grade, unrelated room photos and two flattened poses are not substitutes for film, a canonical model, a spatial walkthrough or a character rig. Missing assets must stay labeled missing in the registry. Do not promote test patterns, rejected experiments or an interim still into production cinematic media.

Every new asset needs a stable registry ID, source, rights record in `ASSETS.md`, subject disclosure, intended integration, source format, framing, light, motion and delivery requirements. Aurora Tide is fictional; never label illustrative media as a real destination, tour, cabin or venue. Preserve one approved canonical geometry and camera-rig identity across future views. Keep `public/cinematic/film/manifest.json` pending until real matched media and technical/visual approval exist.

## Protected systems

WP-01 through WP-07 are presentation/asset work. Do not change PayPal order/capture/refund verification, inventory capacity/holds, PostgreSQL transactions, Gemini tools, LastBoard, Trip Rescue, booking verification, operator authorization or audit trails. Do not replace working data with visual mocks. WP-08/WP-09 require separately authorized specifications before touching those boundaries.

The owner's WP-01 remediation specifically authorizes MigoStage placement/avoidance, scene-observer reliability and greeting/proof copy. Preserve its bus, reducer, gait source, audio and original art. Claude owns WP-02 canonical vessel architecture; Codex must not independently change ShipExplorer facts or invent geometry.

For WP-01, `src/app/api/`, `src/lib/server/`, `src/lib/domain/`, `src/lib/concierge/`, `supabase/`, payment components, original `public/migo/` assets and the Migo bus/machine/audio logic are out of scope. Treat global CSS/layout changes as cross-route risk and run regressions. Never commit secrets, local stores, provider payloads containing personal data or `.env` values. Keep source/rights records separate from code licensing.

## Verification and handoff

Implement code within the package scope; do not turn execution into another planning cycle. Run appropriate automated tests, `npm run typecheck`, `npm run lint`, `npm run build`, browser regressions, desktop/mobile captures and an actual browser recording for animated features. Do not build into the directory used by a running test server. Run browser suites serially; capture performance without parallel builds/tests/recording overhead.

Use isolated local data for HTTP smoke checks. Label fake-provider tests, offline behavior and live external calls accurately. Do not infer live PayPal, Gemini or database verification from mocks or historical logs. Credentials belong in approved environment settings, never chat or commits.

Use `docs/ACCEPTANCE.md` for technical versus visual gates. A green test suite does not approve cinematic quality. Record limitations, missing assets and failed readiness gates. Keep historical evidence and licenses; append corrections/supersession notices rather than erasing them.

Each PR targets integration and includes base SHA, changed modules, objective, implementation, exact check results, evidence links, unresolved dependencies and explicit independent-review questions. Update `docs/HANDOFF.md`, `docs/WORK_PACKAGES.md`, `docs/ASSET_REGISTRY.md` and relevant decisions. Include the next package's entry conditions. Never mark a package complete while its required visual proof is blocked.

New review captures belong under ignored `work/evidence/` and versioned review-only GitHub assets; run `npm run evidence:check`. Preserve historical evidence and follow `docs/EVIDENCE_POLICY.md`.

Native-media browser fixtures require system FFmpeg/ffprobe with libx264 and drawtext plus Chromium. Missing executables are clearly skipped, never counted as native-media verification; use a configured environment for acceptance. The README documents prerequisites. Use SHOREMIGO_DATA_DIR for isolated local smoke data. ESLint ignores alternate .next-*/ and work/ outputs.

Current owner design basis: Aurora Tide 158 m, nine decks, 104 staterooms/~208 guests; Cabin 7214 on Deck 7. Remove Interior Staterooms, conventional theatre and Kids' splash from the planned migration; Tidekeeper Suite is future-only; validate the boutique entertainment lounge's spatial allocation. Claude owns WP-02 PR #3; Codex reviews. Codex's 414b627 review requests corrections, not final modeling approval. Shared docs record decisions without changing protected domain/explorer code. WP-04's next package brief is docs/WP04_BRIEF.md.

## Current accelerated assignment (supersedes stale role/authorization notes)

Owner dispatched Codex WP-04/07/08/09, independently reviewed by Claude. Claude owns WP-02/03/05/06; do not edit those active branches. WP-08/09 now have explicit backend authorization, subject to targeted financial/authorization/concurrency regression coverage. WP-02 at exact 2938befe has independent design-control acceptance recommendation, subject to owner appearance approval and P3 caption cleanup; not frozen or production approved. Governance copies on WP-04 depend on WP-01 documentation only. Keep each package isolated and do not merge/deploy/spend.

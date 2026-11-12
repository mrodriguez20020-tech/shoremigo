# Review evidence storage

## Existing history and open reviews

Keep the already committed Phase 1, Phase 1.5 and original WP-01 screenshots/recordings intact. Their immutable source commits (`eee468f`, `000a837`, `a05d005`/`c64ace1`) and current file paths remain accessible to open PR reviews. Do not rewrite Git history, recompress/overwrite those snapshots or delete required evidence without a verified accessible archive and updated references. Their historical Git footprint cannot be reclaimed without a separate authorized history rewrite; none is performed.

## New evidence

1. Generate into **ignored `work/evidence/<package>-<revision>/`**, never `docs/` or `public/`. `scripts/capture-signature-review.mjs` enforces this and uses JPEG screenshots (quality 86) plus silent H.264 review video. Automated test captures use `EVIDENCE_DIR` under the same workspace. The old `CAPTURE_PREVIEWS` option no longer overwrites archived previews.
2. Keep only review states needed to assess the change: desktop, 320/390 px, tablet, one 20–40 s actual recording for motion, relevant defect reproductions and small raw measurements. Capture actual UI; do not substitute test patterns or imply missing film is complete. Prefer ≤4 MB total compressed evidence per revision; report any justified exception.
3. After checks pass, prefer versioned files on a **review-only GitHub prerelease** in this existing public repository. If the upload host rejects available credentials, use a versioned folder in the connected Drive as an alternate artifact location, preserving its existing sharing and recording authenticated-access limits. Do not fabricate public download URLs or add binaries to Git to bypass authentication. For GitHub, tag/name: `wp01-review-<tested source SHA prefix>` (or equivalent package ID); target the tested feature commit and set prerelease/non-latest. For Drive, use a versioned folder and actual provider URLs, read back MIME/size/access metadata and verify a downloaded archive hash. Clearly label “engineering review evidence, no product release or deployment”. Include source SHA, filenames, byte sizes, SHA-256, measurement scope and visual limitations in a manifest.
4. Upload without clobbering existing files. Keep an archive plus directly downloadable screenshots/recording so reviewers can inspect individual states. Verify actual provider URLs and their access limits after upload; owner-only Drive URLs require authenticated access. This uses existing GitHub release storage; no paid service or Git LFS subscription is introduced. Do not configure production deployment or create a semantic product release.
5. Commit only small Markdown/JSON reports, immutable artifact links, hashes, exact checks and limitations. Update the existing PR and handoff. The release asset is review evidence, not visual approval. Do not publish personal data, credentials or provider secrets.

The GitHub connector in this environment has no release/upload operation; use authenticated `gh release create/upload` for this narrowly scoped review-artifact workflow. Do not infer authorization for unrelated releases or storage services.

## Guard

Run `npm run evidence:check`. It permits existing binary evidence exactly as reviewed at `c64ace1` and rejects new or overwritten binary evidence under `docs/`. Source/runtime assets under `public/` remain subject to the asset registry and licensing review instead. This is a local/reviewer gate, not a claim that GitHub branch protection or CI has been configured.

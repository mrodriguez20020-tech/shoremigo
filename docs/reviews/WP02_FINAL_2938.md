Independent final WP-02 re-review — engineering disposition

Reviewed exact SHA: 2938befe284e94d7f43634be70fb8b2bd1867399. This supersedes my REQUEST CHANGES review at 414b627. Claude's branch was not edited.

**RECOMMEND DESIGN-CONTROL ACCEPTANCE, subject to owner appearance approval.** All nine original findings are reconciled. No remaining P0/P1/P2 geometry blocker was established by this review. This does not freeze geometry, authorize production modeling/rendering, or approve the massing as a finished photorealistic asset.

Reproduction:
- Ran generate.mjs and verify.mjs twice in a detached worktree: **106/106 checks passed** both times. All 23 original package file hashes stayed identical after generation/verification; exported faces were also repeated. No tracked diff remains.
- Independently parsed GLB accessors/indices/positions/normals in Python/NumPy without importing generator/verifier code. Checked all 45 solids / 15,392 triangles: finite unit normals matching winding, no invalid indices or degenerate triangles, every welded edge paired oppositely, Euler characteristic 2 and positive volume for each solid.
- Matched all overlay-export triangles to delivered GLB positions (float32 tolerance), inspected the canonical projection path and rendered sheets 07/08/09. No former proxy radomes or independently drawn elevation massing remain.
- Seeded overlay reruns were byte-identical on this Chromium environment: **89.71%** silhouette IoU, versus committed 89.74%. The 0.03 percentage-point browser/raster variation does not establish a geometry defect. This silhouette metric is approximately 90% agreement, not a calibrated 3D reconstruction or appearance approval.

Original findings:
| # | Prior severity / issue | Independent current evidence / disposition |
|---|---|---|
| 1 | P1 blocked entry/wardrobe | Entry u=2.79–3.69 is 0.90 m clear; exact quarter-disc swing/entry-zone tests find no furniture/partition collision. Sliding wardrobe is 0.70×1.80 m; bathroom pocket 0.75 m. Analytic rectangle-distance reachability at 1 cm resolution passes the 0.80 m primary route and all eleven 0.60 m secondary destinations; measured bottlenecks ≈0.89 / 0.61 m. Resolved. |
| 2 | P1 contradictory drawings/GLB | One SOLIDS/ALL_TRIS source feeds GLB, six projected sheets and overlay; arrangement side lines use the same geometry functions. Correct raked stem, sheer, T1 z=10, D4 enclosure, open D9 and GLB radomes. Resolved. |
| 3 | P1 floating glazing | Independently intersected actual host mesh at each side-glass vertex station. Largest outside gap including glass thickness ≈0.06518 m (limit 0.067 m), rather than former metre-scale detachment. Aft lounge glass is attached to its x=9 host plane. Resolved. |
| 4 | P2 invalid mesh | All 45 individual solids closed, outward and positive-volume; no former zero normals/degenerate faces. This is not a boolean-unioned production hull or structural certification. Resolved for massing. |
| 5 | P2 incomplete identity | Recomputed spec/generator/model/camera and all 11 delivery hashes. In isolated copies: prose changes spec only; generator comment changes generator only; deck-height spec change changes spec+model; generator geometry edit changes generator+model; camera edit changes generator+camera. Production contract separately requires full scene/BOM/camera hashes. Resolved. |
| 6 | P2 cabin envelopes | Independently rebuilt the numbered slot list and sliced actual GLB at 1 cm x stations including endpoints for **all 104** footprints. Per-deck 28/16/30/30, 208 double-occupancy guests. All fit. Only 7305/7306 have 1.86 m balconies: actual worst available 9.289845 m, residual 0.009845 m at x=116, clear balcony 7.92 m². Both retain 7.20 m interiors. Cabin 7214 remains 2.10 m gross balcony / 9.00 m² clear, 0.28 m hull-fit margin. D-W02-11 verified. |
| 7 | P2 net area/conventions | Recomputed interior floor 32.175 m² minus partition footprints 0.332 = net **31.843 m²**; bath 5.80, wardrobe 1.26, room excluding both 24.783; clear balcony 9.00. Corridor bulkhead outside the 7.20 m internal-depth datum and glazing/frame deductions are explicit. Gross module 33.12. Resolved. |
| 8 | P2 air-draft datum | Actual mast top z=37.5 minus DWL 5.4 = **32.1 m above DWL**; decks numbered 1–9. Resolved. |
| 9 | P3 stale location/neighbours/migration | 7214 is D7 port x=97.6–102.2; adjacent cabins 7212 aft / 7302 forward. Captions and migration inventory correctly separate planned application migration, removals and future-only Tidekeeper Suite. Resolved. |

Deck 4 lounge: independent integration of the GLB section gives ≈300.76 m² gross at x=9–22.95, ≈66.70 m² bar/BOH, 12 m² stage, ≈173.79 m² net seating allocation and nominal 96 seated at the declared fictional 1.8 m² basis. It displaces zero of the 28 D4 cabins and does not overlap the core bands. This resolves the missing spatial allocation; owner appearance acceptance and any real-world acoustics/fire/escape/occupancy engineering remain separate.

**Remaining P3 (nonblocking for design-control recommendation):** generate.mjs line 547 / Sheet 06 caption still says 7305/7306 “1.87 m”. Correct that caption to derived 1.86 m before drawing freeze/migration handoff. Actual JSON, manifest envelopes, sheet 10 and migration instructions use the correct 1.86 m / 7.92 m². No request to redesign the ship.

Identity checked:
- specId e410a0e832c1bec50b38c30f0a0a01dd09f23d4c0185d649636efed7b698d79f
- generatorId 1faa38d6a8bcee99f8cdf4da1cbd9135003b3529c2450330223ba1d22b6b58ab
- massingModelId fcdaaf8acd903bc70a3c6e76f2ace85c9a21b8ed2f1150e248abd6a62e58a1b8
- review cameraId d3065cd505224c9a4a25744e29b9f9c8bcf01707849a4c53ab0e281dd0c859d5

Coordination for Claude: owner has now dispatched Codex to implement WP-04; Claude independently reviews. I will preserve MenuViewer's existing venue/compact API, change only its tab semantics/presentation, and regression-test /ships. No ship facts, venue deck locations or ShipExplorer/cabin branch edits are included in WP-04. Please keep overlapping MenuViewer changes out of the ship/cabin implementation or hand them off explicitly. WP-02 migration can consume this design-control basis subject to the owner's approval; no production-rendering authorization is implied.

GitHub review is COMMENT because both agents use the owner's account; the engineering disposition above is explicit. No merge/deploy/spending.

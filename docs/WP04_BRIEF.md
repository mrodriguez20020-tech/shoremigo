# WP-04 · Taste & Indulge — next independent implementation package

**Owner dispatched implementation on November 12, 2026.** The owner requested this next package after WP-01 engineering remediation and WP-02 review. Ownership: **Codex implements; Claude independently reviews**, under the Accelerated Completion directive. One owner per shared component. Do not start competing work on WP-01 or the ship/cabin. Final vessel assets do not block an honest culinary gallery; they do block representing an invented onboard venue as approved architecture.

## Branch and entry conditions

Create `feat/wp04-taste-indulge` directly from the actual fetched `design/cinematic-luxury` SHA, and record full base/head in its draft PR. Current observed integration is `000a837adfa8bf3ed39f05be61e09a4bc3f6df3e`. PR #2 and #3 remain unmerged. Read their current shared instructions by exact ref; do not silently stack or import their entire changes. Verify any required UI dependency explicitly. No merge, production deployment or spending is authorized.

Read AGENTS, HANDOFF, DESIGN_BIBLE, ACCEPTANCE, ASSETS and the asset registry first. Inspect actual `/taste`, `src/components/dining/{MenuViewer,DishArt,AskMigoButton}.tsx`, `src/lib/domain/dining.ts` and the food excursion/catalog path. Existing menu and food-tour inventory are functional. Record baseline screenshots and checks before editing.

## Concrete implementation scope

1. Build a premium responsive **Local Flavours / Restaurants / Food Tours / Drinks & Cocktails / Desserts & Sweets** editorial experience using the current sections and honest fictional sample content. Preserve section anchors, menu prices/tags, current excursions and the Migo planning action. Do not invent restaurants, venue partnerships, available excursions or dietary assurances.
2. Add a culinary media manifest under an isolated presentation module (`src/lib/culinary/` or equivalent). Each entry binds an existing dish/menu subject to source ID, rights record, original/master and derivative paths, dimensions, focal point, alt text and illustrative/generated disclosure. Missing or unverified entries render the existing meaningful vector fallback, never a mismatched stock dish.
3. Implement image expansion: a named thumbnail/button opens the **same subject/image** in a dialog, with caption/disclosure and previous/next controls. Use a restrained 250–400 ms shared-image transform/dissolve when motion is allowed. No forced page scroll, invented 3D restaurant or video morph. Preserve visual continuity from thumbnail to full image and back. First produce a reviewable functional slice with a verified asset or explicit fallback; obtain owner visual review before calling the interaction approved.
4. Keyboard/touch: Enter/Space opens; Escape closes; focus stays in dialog and returns to the opener, including navigation/unmount. Background becomes inert; scroll lock is restored. Name close/previous/next controls, announce item changes, and use appropriate alt text. No hover-only action or mandatory swipe/drag. Reduced motion uses an immediate/short opacity change; Save-Data and error cases retain usable menus.
5. Refine the sample menu interaction with correct tab focus/arrow/Home/End behavior, tab/panel associations and stable height/loading. `MenuViewer` is also used by Ships & Rooms: coordinate any shared change and run `/ships` regressions. Keep legal-age/alcohol and sample-price labels, ingredients disclaimer and no venue-booking claim.
6. Keep the actual food excursion cards driven by `availabilitySnapshot`, server prices and LastBoard. Expansion must not intercept booking links or fabricate capacity. Preserve excursion→reserve→checkout handoff and unconfigured-provider behavior. Do not change booking, PayPal, Gemini, inventory, Trip Rescue or operator code.

## Asset acquisition and limits

M-04 is still **missing**. No paid stock, generation, freelance work, new service signup or production rendering is authorized. Existing restaurant atmosphere is illustrative, not proof of a real venue or dish. Use only team-created or appropriately licensed commercial-display/derivative assets with explicit records in ASSETS; verify food identity (e.g. doubles' bara/channa, dhalpuri vs paratha, a baleada vs generic taco) before binding IDs. Generated assets must be labeled illustrative. Do not promise exact ingredients, allergen absence or availability from an image.

For the first reviewed set, specify the exact subjects from existing content: doubles, roti, pelau, cochinita pibil, baleada, jerk chicken, sorrel/mauby, marquesita and the selected sample desserts/drinks. This is an acquisition checklist, not an assertion that assets exist. Source long edge ≥2400 px for expansion review; responsive AVIF/WebP derivatives at appropriate sizes, no full gallery eager-download. Set final image/route byte budgets from a measured first slice before bulk export; include before/after transfer, decode and layout-shift results. Do not choose a paid source to fill gaps.

## Ship facts and cross-package boundaries

Owner's provisional Aurora Tide basis: **158 m, nine decks, 104 staterooms, ~208 guests**, Cabin **7214** on Deck 7. Claude owns WP-02; Codex reviews. Codex re-reviewed exact PR #3 head `2938befe284e94d7f43634be70fb8b2bd1867399`: all nine findings resolved; recommend design-control acceptance subject to owner appearance approval, with one nonblocking Sheet 06 caption correction. The GLB is design control, not production quality. Do not create a second vessel or relocate onboard venues independently.

Interior Staterooms, conventional theatre and Kids' splash are removed from the planned migration. Tidekeeper Suite is future-only; the Deck 4 boutique lounge has independently checked design-control allocation; real-world engineering/occupancy is not certified. Existing `dining.ts` Deck 11 pool / Deck 6 promenade strings await the scoped Ships & Rooms migration to Deck 7 aft / Deck 5 respectively. WP-04 must flag/coordinate those references rather than silently changing protected domain content. Shore food guidance is independent of that unresolved vessel adapter.

## Acceptance and handoff

- Focused tests for expansion lifecycle, keyboard/touch, back/focus restoration, reduced motion, missing/broken image and disclosure; menu tabs and food-booking link regressions. Validate 320×700, 390×844, 820×1180 and 1440×1000 with Migo/control clearance and no overflow.
- Run unit tests, TypeScript, lint, a production build, browser regressions and isolated HTTP smoke checks. State exactly which external providers/database paths were configured, skipped or mocked. Do not infer live success from UI fixtures.
- Supply real screenshots and a 20–40 s **actual browser** expansion/menu recording, asset source/rights/hash manifest and measured transfer/CLS/loading. Follow EVIDENCE_POLICY; no new binary evidence in Git source history.
- Update package ownership/handoff/registry and open one draft PR to integration. Separate engineering acceptance from asset/visual approval. Ask Claude to independently review the actual head, assets, dialog lifecycle, shared MenuViewer diff and booking regression. Owner approves appearance. Unavailable images/design decisions remain named blockers; a working vector fallback is not photoreal completion.

No WP-04 source implementation is included in the WP-01 remediation PR. This brief is the independent handoff, not a redesign of the product or authorization to merge.

# Ships & Rooms migration (WP-02 → separately scoped application work)

Owner decisions D-W02-1…3, 6 and 7 make the references below obsolete. **WP-02 does not edit application code.** This document is the exact scope and plan for the separate, owner-authorized Ships & Rooms migration.

Line numbers were **re-verified on `main` @ `630d0b2`** (2026-11-12); re-check them at implementation time.

Every replacement value comes from:
- [`vessel.json`](vessel.json): decks, `accommodation.offering/removed/futureConcepts`, `cabin7214`, `amenityMap`, `entertainmentLounge`;
- [`manifest.json`](manifest.json): derived capacity, computed cabin position, lounge metrics, `specId` / `massingModelId`.

## 1. Application code
| File · line (`main`) | Current value | Required change | Decision |
|---|---|---|---|
| `src/lib/domain/ship.ts:19` | `["Guests", "≈1,900 (illustrative)"]` | `≈208 (illustrative)`, optionally `104 staterooms` | D-W02-3 |
| `src/lib/domain/ship.ts:20` | `["Decks", "14 (11 shown)"]` | `9 (7 shown)` (decks 3–9) | D-W02-2/3 |
| `src/lib/domain/ship.ts:26–38` `DECKS` | 11 decks numbered 3–14 (Skywatch, Spa & Fitness, Lido, Suites, Balcony, Oceanview, Interior, Promenade, Atrium, Theatre, Gangway) | The 7 visible decks of `vessel.json`: D3 Marina, D4 Oceanview + entertainment lounge, D5 Promenade, D6 Horizon, D7 Meridian, D8 Observation, D9 Sun deck. Highlights from `amenityMap` | D-W02-2/4/7 |
| `src/lib/domain/ship.ts:29` | Lido deck 11 highlights incl. `"Kids' splash zone"` | Removed. Pool + Sea Glass Grill become D7 aft terrace T4 | D-W02-7 |
| `src/lib/domain/ship.ts:31` | `"Balcony staterooms (demo cabin 9214)"` on deck 9 | D7 Meridian: `"Premium balcony staterooms (Signature Cabin 7214)"` | D-W02-1 |
| `src/lib/domain/ship.ts:36` | Deck 4 "Theatre": `"Tidewater Theatre", "Live music lounge"` | D4: oceanview staterooms + boutique entertainment lounge (live music, evening performance); **no theatre** | D-W02-7 |
| `src/lib/domain/ship.ts:52` `CABINS.interior` | Interior Stateroom | **Remove** | D-W02-6 |
| `src/lib/domain/ship.ts:53` `CABINS.oceanview` | "Up to 3 · Queen + sofa bed · ≈190 sq ft" | Deck 4 Oceanview, ≈356 sq ft gross module (4.6 × 7.2 m), no balcony | D-W02-3/6 |
| `src/lib/domain/ship.ts:54` `CABINS.balcony` | "Queen + sofa bed · ≈210 sq ft + balcony" | **Premium Balcony Stateroom**: king bed, ≈343 sq ft net (31.84 m², measured) + ≈97 sq ft (9.0 m²) balcony, panoramic sliding glass doors; decks 5–7 (values from the generated adapter) | D-W02-1/6/8 |
| `src/lib/domain/ship.ts:55` `CABINS.suite` | Tidekeeper Suite ≈400 sq ft | **Remove from offered cabins.** Optionally a separate "Future concept (not available)" note, never bookable or shown as accommodation | D-W02-6 |
| `src/lib/domain/ship.ts:64–65` `DEMO_CABIN.number` | `"9214"` | `"7214"` | D-W02-1 |
| `src/lib/domain/ship.ts:75–84` `AMENITIES` | Lido 11, Spa 12, Fitness 12, Tidewater Theatre 4, Observation 14, Kids' splash 11, Promenade 6, Excursions desk 5 | Pool/Grill D7 aft; Spa + fitness D8 midship; Observation D8 forward; Promenade + Nightwatch D5; Excursions concierge desk D5 atrium; Sun deck D9; **Entertainment lounge D4 aft**; theatre and splash removed | D-W02-4/7 |
| `src/components/ship/ShipExplorer.tsx:251` | `Cabin {DEMO_CABIN.number} · Balcony Stateroom · Deck 9` | `· Premium Balcony Stateroom · Deck 7` | D-W02-1 |
| `ShipExplorer.tsx` `ShipProfile` (deck selector) | Hand-drawn generic 11-tier block, coral funnel | Draw from `vessel.json` decks (or the generated port elevation), labelled "schematic development preview" | D-W02-2, owner §6 |
| `ShipExplorer.tsx` `CabinScene` (four illustrated views) | Unrelated illustrations | Keep the existing images labelled "illustrative" until WP-03, **or** show sheet 08 as the plan. No new "walkthrough" claim until WP-03 builds V1–V6 | WP-03 |
| `src/lib/domain/dining.ts:151` | `"Aurora Tide · Deck 11 pool (demo vessel)"` | `"Aurora Tide · Deck 7 aft pool terrace (demo vessel)"` | D-W02-4 |
| `src/lib/domain/dining.ts:164` | `"Aurora Tide · Deck 6 promenade (demo vessel)"` | `"Aurora Tide · Deck 5 promenade (demo vessel)"` | D-W02-4 |
| `src/lib/domain/dining.ts:137` | `"Aurora Tide · Deck 5 aft (demo vessel)"` | unchanged | n/a |
| `src/lib/concierge/tools.ts` `get_dining_guide` | returns `SHIP_VENUES.where` | no code change; inherits `dining.ts` | n/a |

Not affected:
- Migo's persona name "The Little Tidekeeper" (`concierge/engine.ts:22`), which is a character, not a suite.
- Excursion `guests` counts, which are party sizes.
- Booking, checkout, PayPal, operator, rescue and LastBoard code. None of it imports `@/lib/domain/ship`: only `ShipExplorer.tsx` does, and `tools.ts` reads only `dining.ts`.

## 2. Documentation
| File (branch) | Reference | Change |
|---|---|---|
| `docs/STATUS.md:21` (`main`) | "walkthrough of demo cabin 9214" | Cabin 7214; note schematic preview |
| `docs/DESIGN_BIBLE.md:23, 46` (PR #2) | Cabin 9214 | Cabin 7214; plan supplied by WP-02 |
| `docs/ACCEPTANCE.md:21` (PR #2) | WP-03 Cabin 9214 | Cabin 7214 |
| `docs/ASSET_REGISTRY.md:40` (PR #2) | M-03 Cabin 9214 | Cabin 7214 |
| `docs/WORK_PACKAGES.md:13, 40` (PR #2) | WP-03 Cabin 9214; WP-02 unassigned | Cabin 7214; WP-02 owner Claude, reviewer Codex |
| `docs/DECISIONS.md:26` (PR #2) | O-003 | record D-W02-1…10 |

The PR #2 documents belong to Codex's WP-01 branch: listed for that owner, not edited by WP-02.

## 3. Scoped implementation plan (ready; starts only on owner authorization after geometry acceptance)
**Branch (corrected after Codex review):** `feat/ships-rooms-migration` from the **approved `design/cinematic-luxury` integration SHA**, created only after WP-02 is re-reviewed and the owner authorises its integration. This is required because the tests and the adapter depend on `design/aurora-tide/`. It does **not** start from `main`, and nothing is changed on `main`. If work must start before integration, the fallback is an explicitly dependent **draft** branch based on and targeting `feat/wp02-aurora-tide`. That branch must not merge unapproved dependencies or create a competing canonical design. It is separate from WP-01 and Codex's branches.
**Scope:** only the files in §1, plus `docs/STATUS.md`, plus new tests. No changes to booking, excursion, concierge, PayPal or store code.

1. **Generated typed adapter (no hand-copied facts).** A small script (`design/aurora-tide/export-app-data.mjs`) emits `src/lib/domain/vessel.generated.ts` from `vessel.json` + `manifest.json`: decks 3–9, offering, amenities with decks, the validated slot counts, Cabin 7214 position/neighbours/areas, and `specId`/`massingModelId`. A unit test regenerates it and fails on any diff, so the app cannot drift from the canonical spec. The app does not read the design directory at runtime.
2. **`ship.ts` from `vessel.ts`:**
   - `DEMO_SHIP.facts`: 208 guests, 104 staterooms, 9 decks, 158 m.
   - `DECKS`: 7 visible decks.
   - `CABINS`: Oceanview and Premium Balcony; no interior; no suite.
   - `DEMO_CABIN`: 7214.
   - `AMENITIES`: the approved set, including the entertainment lounge on D4.
3. **`ShipExplorer.tsx`:**
   - Header text for Cabin 7214 on Deck 7.
   - The deck profile draws from `DECKS` (schematic), with a visible "Schematic development preview, not the final vessel" label.
   - Rooms tab: two types plus the signature cabin.
   - Cabin views stay labelled illustrative, or sheet 08 is offered as the plan.
4. **`dining.ts`:** two `where` strings.
5. **Tests:**
   - New Vitest: capacity/deck/offering/amenity consistency with `vessel.json`; no "Interior", "Theatre", "splash", "9214" or bookable "Suite" in `ship.ts` exports.
   - New Playwright on `/ships`: overview facts, 7 deck buttons with keyboard selection, Rooms shows 2 types + 7214, amenities list includes the lounge and excludes the theatre/splash zone, preview label visible.
   - **Regression:** the full existing suite must stay green (`booking-flow`, `concierge`, `inventory`, `lastboard`, `migo-and-match`, `postgres-store`, plus e2e booking/checkout/rescue flows). Sandbox-only payment checks stay as they are. No live payments.
6. **Evidence:** before/after screenshots of `/ships` (desktop + 390 px), test output, `git diff --stat` limited to the scoped files.
7. **Delivery:** a draft PR for review. No merge or deploy without owner authorization.

**Readiness:**
- Inventory complete and re-verified on `main`.
- Values derived and checked by `verify.mjs` (103/103, independent of the generator).
- No dependency on the photoreal asset.
- **Waiting on:** Codex re-review of the corrected WP-02 SHA, owner decision on the 7305/7306 tapered-balcony proposal, owner geometry acceptance and integration of WP-02 into `design/cinematic-luxury`, and owner authorization to start.

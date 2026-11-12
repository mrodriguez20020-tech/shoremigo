# Ships & Rooms migration inventory (WP-02 → authorized Ships & Rooms / WP-03 work)

Owner decisions D-W02-1…3 (2026-11-12) make the following existing references obsolete. **WP-02 does not edit application code**; this list is the exact scope for the future authorized Ships & Rooms implementation. Line numbers are from `design/cinematic-luxury` @ `000a837`; re-check them at implementation time.

Source of truth for every replacement value: [`vessel.json`](vessel.json) (decks, capacity, `cabin7214`, `amenityMap`) and [`manifest.json`](manifest.json) (derived capacity, computed cabin position, geometryId).

## Application code

| File · line | Current value | Required change | Decision |
|---|---|---|---|
| `src/lib/domain/ship.ts:19` | `["Guests", "≈1,900 (illustrative)"]` | `≈208 (illustrative)`; optionally show 104 staterooms | D-W02-3 |
| `src/lib/domain/ship.ts:20` | `["Decks", "14 (11 shown)"]` | `9 (7 shown)` (decks 3–9 visible) | D-W02-2/3 |
| `src/lib/domain/ship.ts:26–38` `DECKS` | 11 decks numbered 3–14 (Skywatch 14, Spa & Fitness 12, Lido 11, Suites 10, Balcony 9, Oceanview 8, Interior 7, Promenade 6, Atrium 5, Theatre 4, Gangway 3) | Replace with the 7 visible decks of `vessel.json` (`D3 Marina … D9 Sun deck`) and their uses; highlights from `amenityMap` | D-W02-2/4 |
| `src/lib/domain/ship.ts:31` | `"Balcony staterooms (demo cabin 9214)"` on deck 9 | Deck 7 Meridian highlights incl. `"Panoramic balcony staterooms (demo cabin 7214)"` | D-W02-1 |
| `src/lib/domain/ship.ts:52` `CABINS.interior` | Interior Stateroom | Derived layout has **no interior staterooms**: remove, or owner confirms an exception | open (amenityMap.unresolved) |
| `src/lib/domain/ship.ts:53` `CABINS.oceanview` | "Up to 3 · Queen + sofa bed · ≈190 sq ft" | Deck 4 Oceanview; size from module (≈356 sq ft gross for the 4.6 × 7.2 m module; oceanview has no balcony) | D-W02-3 |
| `src/lib/domain/ship.ts:54` `CABINS.balcony` | "Up to 3 · **Queen + sofa bed** · ≈210 sq ft + balcony" | Premium Balcony Stateroom: **King bed**, ≈356 sq ft (33.1 m²) + ≈97 sq ft (9.0 m²) balcony, panoramic sliding glass doors | D-W02-1, cabin brief |
| `src/lib/domain/ship.ts:55` `CABINS.suite` | Tidekeeper Suite ≈400 sq ft | Not in the derived layout; owner to confirm whether suites exist (e.g. Deck 7 aft) | open |
| `src/lib/domain/ship.ts:64–65` `DEMO_CABIN.number` | `"9214"` | `"7214"` | D-W02-1 |
| `src/lib/domain/ship.ts:75–84` `AMENITIES` | Lido 11, Spa 12, Fitness 12, Theatre 4, Observation 14, Kids' splash 11, Promenade 6, Shore Excursions desk 5 | Pool/Grill → D7 aft; Spa/fitness → D8 midship; Observation → D8 forward; Promenade → D5; Excursions desk → D5 atrium; Theatre and Kids' splash zone: owner decision | D-W02-4, amenityMap |
| `src/components/ship/ShipExplorer.tsx:255` | `Cabin {DEMO_CABIN.number} · Balcony Stateroom · Deck 9` | `· Premium Balcony Stateroom · Deck 7` (number comes from `DEMO_CABIN`) | D-W02-1 |
| `src/components/ship/ShipExplorer.tsx` `ShipProfile` | Hand-drawn generic 11-tier block with coral funnel | Draw from `vessel.json` (or the generated port elevation); no second ship design | D-W02-2 |
| `src/components/ship/ShipExplorer.tsx` cabin walkthrough (`CabinScene`) | Four unrelated illustrated views | Replaced only by WP-03 spatial work built on [`sheets/08-cabin-7214-plan.svg`](sheets/08-cabin-7214-plan.svg) viewpoints V1–V6 | WP-03 |
| `src/lib/domain/dining.ts:151` | `"Aurora Tide · Deck 11 pool (demo vessel)"` (Sea Glass Grill) | `Deck 7 aft pool terrace` | D-W02-4 |
| `src/lib/domain/dining.ts:164` | `"Aurora Tide · Deck 6 promenade (demo vessel)"` (Nightwatch Patisserie) | `Deck 5 promenade` | D-W02-4 |
| `src/lib/domain/dining.ts:137` | `"Aurora Tide · Deck 5 aft"` (Compass Rose) | Unchanged (matches D5 aft) | n/a |
| `src/lib/concierge/tools.ts` `get_dining_guide` | Returns `SHIP_VENUES.where` | No code change; inherits the corrected `dining.ts` strings | n/a |

Not affected: excursion `guests` counts throughout booking, checkout, operator, rescue and concierge code (party sizes, not ship capacity).

## Documentation

| File (branch) | Reference | Change |
|---|---|---|
| `docs/STATUS.md:21` (`main`/integration) | "walkthrough of demo cabin 9214" | Cabin 7214 |
| `docs/DESIGN_BIBLE.md:23, 46` (PR #2 @ `c64ace1`) | "Cabin 9214" requirement/missing reference | Cabin 7214; envelope and plan now supplied by WP-02 |
| `docs/ACCEPTANCE.md:21` (PR #2) | WP-03 "Cabin 9214" | Cabin 7214 |
| `docs/ASSET_REGISTRY.md:40` (PR #2) | "M-03 spatial Cabin 9214" | Cabin 7214 |
| `docs/WORK_PACKAGES.md:13, 40` (PR #2) | "WP-03 Spatial Cabin 9214"; WP-02 "Unassigned" | Cabin 7214; WP-02 owner Claude, reviewer Codex |
| `docs/DECISIONS.md:26` (PR #2) | O-003 "Cabin 9214 floor plan" | Record D-W02-1…5; O-002/O-003 partially resolved |

The PR #2 documents belong to Codex's WP-01 branch; they are listed here for the WP-01 owner/owner to update, not edited by WP-02.

# Accessibility audit — `feat/shoremigo-product-completion`

2026-11-12. Automated: axe-core (rules tagged wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa) on the production build, 12 routes × desktop 1440×900 and phone 390×844, reduced motion. Script: `work/a11y-scan.mjs` (untracked). Existing browser tests already cover welcome focus trap / Escape / consent, modal focus restore, keyboard navigation in the culinary viewer and the discovery reveals.

Routes: `/`, `/excursions`, `/excursions/coz-palancar-snorkel`, `/discover/reef`, `/discover/canopy`, `/taste`, `/ships`, `/trip`, `/bookings`, `/crew`, `/operator`, `/trip/plan`.

## Results

| Finding | WCAG | Where | Disposition |
|---|---|---|---|
| Horizontal page overflow at 390 px | 1.4.10 Reflow | all 24 scans | **None found** |
| Scrollable crew invite link not keyboard reachable | 2.1.1 Keyboard | `/crew` phone | **Fixed**: focusable, labelled, visible focus ring |
| Hero button visible text "Meet doubles", accessible name "Explore Doubles" | 2.5.3 Label in Name | `/taste` | **Fixed**: name now "Meet doubles"; redundant photo badge hidden from assistive tech (the image alt carries it) |
| `label-content-name-mismatch` on the 21 dish-card buttons + hero | 2.5.3 | `/taste` (22 per viewport) | **Reviewed, not a defect**: each name contains the button's visible label (dish name / call to action). axe counts the whole card's visible text, including the photo badge, region, number and description, as label text. Restructuring cards so the description sits outside the button would silence it; deferred as a design change. |
| All other axe rules | — | 21 of 24 scans | **0 violations** |

## Not covered by automation (manual follow-up)

- Screen-reader walkthrough (NVDA / VoiceOver) of booking → checkout → My Trip → Trip Rescue.
- PayPal's own popup/iframe (third-party, outside our control).
- Colour contrast over moving film/scene backdrops (axe evaluates the rendered frame only; reduced-motion was used).
- 200 % / 400 % zoom on desktop beyond the 390 px reflow check.

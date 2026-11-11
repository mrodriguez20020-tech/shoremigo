# Cinematic Luxury · Phase 1 review

Phase 1 replaces the welcome and homepage presentation with an atmospheric tropical travel experience. It keeps the original Migo character, event bus/state machine, booking and inventory logic, PayPal integration, Gemini concierge, Trip Rescue and operator workflows.

## Implemented

- A short photographic establishing shot, followed by a full-screen welcome with the original Migo wave pose and spring entrance. The intro runs once per session and is skippable; reduced motion bypasses it.
- Independent, optional country and language selection (English, Spanish, French, Portuguese). Language never derives from country. Session-only preferences by default, persistent storage only after explicit opt-in, and consent can be revoked through Language & region.
- Skip and Escape, keyboard radio navigation, visible focus, dialog focus containment, inert background, scroll locking and focus restoration. The welcome remains usable when browser storage is blocked.
- A photographic hero, locally hosted fonts, navy/ivory/champagne palette, refined type and controls, editorial discovery cards, an ivory ports section and a photographic golden-hour scene. Existing links and the interactive LastBoard clock remain available.
- **750 ms** coordinated sunset photography and scene-lighting transitions, including Migo's scene tint. A central viewport observation band handles tall sections and ultrawide screens; orientation/resize recalculates the band.
- OS reduced-motion and manual pause support for reveals, parallax, scene transitions, clock auto-cycling and Migo. The compact mobile Migo launcher moves clear of marked controls. The homepage does not render the hidden animated vector backdrop; other routes retain it.
- Original artwork is unchanged. All photos are locally stored, licensed stock imagery with adjacent illustrative disclosures and provenance in [ASSETS.md](../ASSETS.md). No stock image is claimed to show a listed destination, excursion, restaurant or the fictional Aurora Tide.

## Review captures

Captures use the production build in Chromium. Mobile welcome content scrolls to keep all controls available at small sizes.

| View | Desktop · 1440×1000 | Tablet · 820×1180 | Mobile · 390×844 |
|---|---|---|---|
| Welcome | [View](previews/welcome-desktop.png) | [View](previews/welcome-tablet.png) | [View](previews/welcome-mobile.png) |
| Homepage | [View](previews/home-desktop.png) | [View](previews/home-tablet.png) | [View](previews/home-mobile.png) |
| Golden hour | [View](previews/sunset-desktop.png) | [View](previews/sunset-tablet.png) | [View](previews/sunset-mobile.png) |

[Small-screen welcome preferences, scrolled to the controls · 320×700](previews/welcome-mobile-preferences.png). This viewport also passed the manual horizontal-overflow check on the homepage.

## Validation

- `npm test`: 68 passed; 4 Postgres integration tests skipped because `DATABASE_URL` is unavailable.
- `npm run lint`: no errors; three existing Next.js warnings for Migo sprite `<img>` elements.
- `npm run typecheck`: passed.
- `npm run build`: passed, using bundled OFL fonts without Google Fonts network requests.
- `node scripts/smoke.mjs http://127.0.0.1:3000 --operator-passcode=...`: all 17 checks passed against the production server with isolated local demo data. Covers availability, match, offline concierge, prepared bookings, price validation, verification gates, operator access, disruption feasibility, seat holds and unconfigured PayPal behavior.
- `npm run test:ui`: **8 passed** against the production build. Browser regressions cover focus/Skip/Escape, independent country/language, storage consent and revocation, blocked storage, responsive layouts, mobile control avoidance, sunset timing, reduced motion, manual pause, ultrawide scene activation, port navigation and concierge opening.

Reproduce browser checks with `npm run build && npm start` in one terminal and `npm run test:ui` in another after `npx playwright install chromium`. Use `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium` for system Chromium. `CAPTURE_PREVIEWS=1 npm run test:ui` regenerates the nine primary captures.

Live PayPal sandbox payments and Gemini calls were not re-run: this environment has no provider credentials. Their existing mocked integration tests pass, and HTTP smoke checks confirm honest unconfigured/offline behavior. No backend, payment, database, state-machine or domain logic was changed. No production deployment or merge is part of this change.

## Subsequent phases

Aurora Tide vessel visuals, spatial cabin walkthroughs, immersive culinary transitions, reef and rainforest environments, and advanced Migo animation remain outside Phase 1. The new photography is atmospheric; destination-specific imagery needs subject verification before it can represent inventory.

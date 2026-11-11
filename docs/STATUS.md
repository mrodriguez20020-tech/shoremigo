# ShoreMigo implementation status (2026-11-11)

Legend: **IMPLEMENTED** = working and checked · **PARTIAL** = exists, missing parts or verification · **MISSING** · **BLOCKED** (reason given) · **DEFERRED** (after submission, intent recorded).

Evidence for payments, AI and deployment is in [VERIFICATION.md](VERIFICATION.md).

| Module | Status | What exists / what's missing |
|---|---|---|
| Welcome | IMPLEMENTED | First visit: independent country + language (EN/ES/FR/PT), skip, consent-aware storage (session by default, local only if "Remember" ticked), Migo greeting in the chosen language; reopen via Account → Language & region. Checked in browser (Spanish + Trinidad and Tobago). |
| Localization | PARTIAL | Translated: navigation, welcome, Migo greeting, homepage hero + discovery. Other pages fall back to English, as the picker states. |
| Homepage | IMPLEMENTED | "Your Caribbean adventure starts here", port selector, live LastBoard port-day clock, four discovery tiles (Explore & Adventure, Taste & Indulge, Ships & Rooms, Relax & Unwind), How ShoreMigo works, Adventure Match, golden-hour scene, Trip Rescue story. |
| Navigation | IMPLEMENTED | Explore · Ships & Rooms · My Trip · Bookings · Crew; Account menu (booking sign-in, language & region, Taste, Relax, Adventure Match, operator console); mobile menu with the same links. No dead links. |
| Visual system | PARTIAL | Approved palette applied (deep ocean, sea glass, aqua, coral, amber, ivory), scene lighting, original vector art throughout. **Photography: DEFERRED** (no licensed, correctly identified photos available; nothing generated is passed off as a real place). |
| Migo | IMPLEMENTED (2D sprite) | Approved character sprites; event-driven states (idle, walk, wave, curious/point, thinking, concerned, celebrate only after server-verified capture, docked during checkout/operator/welcome); **drag-and-release with safe snapping** (avoids marked forms/CTAs) and arrow-key alternative; **hop to the chat panel and back**; reduced-motion, hide/pause controls; opt-in synthesized sounds. True 3D rig: DEFERRED. Distinct reassuring/apologetic/sleeping poses: PARTIAL (mapped onto existing 8 poses). |
| Explore | IMPLEMENTED | Port + category filters, live seats/price/feasibility per tour, detail pages with LastBoard timeline, reserve form. |
| Relax & Unwind | IMPLEMENTED | `/excursions?mood=relax`: gentlest experiences (intensity 1) from the same live inventory; linked from homepage, header and Explore. |
| Taste & Indulge | IMPLEMENTED | `/taste`: factual dish guide (incl. doubles, roti, bake and shark, pelau, sorrel, mauby), bookable food tour from live inventory, Plan-a-food-day prompt for Migo. |
| Food menus | IMPLEMENTED (sample) | Tidewalk Kitchen, a fictional demo venue with a tabbed menu: breakfast, street food, mains, drinks, desserts. Sample USD prices, alcohol labels, no allergen claims. Real restaurant listings: DEFERRED until verified partners exist. |
| Drinks | IMPLEMENTED (guide + sample) | Local drinks guide plus sample drinks menu; alcoholic items labeled for legal drinking age only. |
| Desserts | IMPLEMENTED (sample) | Desserts section and menu tab with sample prices. |
| Ships & Rooms | IMPLEMENTED (demo) | `/ships`: fictional Aurora Tide; Overview, Decks (clickable, keyboard-accessible side profile), Rooms (4 types) with **walkthrough of demo cabin 9214** (4 illustrated views, arrow keys), Amenities linked to decks, hand-off to port discovery. Labeled DEMO VESSEL / ILLUSTRATIVE CABIN; no cabin sales. |
| Ship dining | IMPLEMENTED (sample) | Three onboard venues with sample menus, kept separate from shore restaurants. |
| Gemini AI | IMPLEMENTED | Server-side function calling with read-only tools (search, details, schedule, policies, match, prepare booking, booking/payment/rescue status, **dining guide**); verification gate for personal data; offline fallback clearly labeled. Live on production with `gemini-flash-lite-latest` because the key's 3.6-flash quota was exhausted. |
| My Trip | PARTIAL | Booked trip: Shore Pass, LastBoard timeline, payment evidence, delay simulation, Trip Rescue. **Multi-experience itinerary builder (add/remove several items, combined conflicts): DEFERRED**. Acceptance: deterministic overlap + port-window check across items, estimated vs verified prices separated. |
| Inventory | IMPLEMENTED | Server-owned capacity, 15-min holds with expiry, operator capacity/sales controls (can't go below committed seats or above vehicle), atomic Postgres transactions on Vercel (verified across 10 concurrent connections), audit. Per-session time slots (multiple departures per tour): DEFERRED. |
| PayPal | IMPLEMENTED (sandbox) | Create → buyer approval → server capture → verify amount/currency/status/custom_id → persist. Verified live: captures, duplicate-capture protection, decline + retry, refunds (partial and full). The earlier COMPLIANCE_VIOLATION was the old seller account; resolved with a US sandbox business account. Sandbox Personal-wallet login approval: not automated (card guest path used). |
| Bookings | IMPLEMENTED | `/bookings`: verified booking with booking status and PayPal capture/refund records as recorded; checked with a rebooked + partially refunded booking. |
| Shore Pass | IMPLEMENTED | Confirmation pass with PayPal capture status stamp; shareable text without last name/email. PDF export and QR: DEFERRED (no fake QR). |
| Trip Rescue | IMPLEMENTED | Simulated delay → LastBoard infeasibility → alternatives with live seats → operator review → customer consent → PayPal refund/top-up → persisted rebooking; replay protection. Verified live (local) with real sandbox refunds. |
| Operator | IMPLEMENTED | Passcode-protected console: KPIs, disruption control, schedule/resource clashes, Inventory tab, Trip Rescue reviews, bookings with PayPal re-verify, audit trail, engagement. |
| Crew | IMPLEMENTED (concept demo) | `/crew`: fictional creator profile, generated referral link, illustrative earnings estimate. No tracking, commissions or payouts (stated on page). |
| Mobile / accessibility | IMPLEMENTED (checked) | No horizontal overflow at 390 px on home, Explore, Relax, Taste, Ships, Bookings, Crew; keyboard tabs/decks/cabin views; focusable Migo with arrow keys; reduced motion; opt-in audio. A full screen-reader audit is not done. |
| Deployment | IMPLEMENTED | https://shoremigo.vercel.app (Vercel + Neon Postgres, sandbox only). All pages in this file deployed 2026-11-11 (commit 786facc); production smoke test 22/22 after deploy. |
| GitHub | IMPLEMENTED | https://github.com/mrodriguez20020-tech/shoremigo (public, MIT for code; Migo artwork excluded from MIT). All commits pushed (main = 786facc). |
| Video | MISSING | Owner to record from [DEMO_SCRIPT.md](DEMO_SCRIPT.md) and upload to YouTube. |
| Devpost | PARTIAL | Materials in [SUBMISSION.md](SUBMISSION.md); final submission is the owner's action. |

## Deferred roadmap (intent and acceptance criteria)
- **Licensed photography:** a per-asset source/license manifest in ASSETS.md; every photo matches its named place or dish; responsive AVIF/WebP.
- **Itinerary builder:** add several experiences to My Trip; LastBoard checks overlaps, transfers and the port window across items; impossible plans explained with alternatives.
- **Time slots:** several departures per experience, each with its own capacity and holds.
- **Real restaurant listings:** verified venue data, official links, no invented partnerships.
- **Full translation:** all pages in ES/FR/PT with reviewed copy.
- **Migo 3D/Rive rig** of the same character, with the 15 states as separate animations.
- **Crew backend:** attribution, commission terms and payouts only after operator agreements.
- **Shore Pass PDF and a QR code** that resolves to a real verification endpoint.

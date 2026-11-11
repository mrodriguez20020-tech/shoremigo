# ShoreMigo

**Your adventure doesn't stop when plans change.**

ShoreMigo is a cruise shore-excursion companion: discover tours that fit your ship's real port schedule, book them with PayPal, and recover gracefully when the ship runs late. Migo, *the Little Tidekeeper*, is the AI concierge and brand character who guides the whole journey.

Built for the PayPal AI Hackathon 2026.

**Live demo:** https://shoremigo.vercel.app (PayPal **sandbox** only; no real money) · **Status matrix:** [docs/STATUS.md](docs/STATUS.md) · **Judge guide:** [docs/SUBMISSION.md](docs/SUBMISSION.md#testing-instructions-for-judges) · **Evidence:** [docs/VERIFICATION.md](docs/VERIFICATION.md)

```
DISCOVER → PERSONALIZE → VALIDATE → BOOK → ADAPT → RECOVER
 explore    Adventure     LastBoard   PayPal   simulated   Trip Rescue:
 + Migo     Match + AI    feasibility Orders   delay       operator review →
                                      v2                   customer approval →
                                                           PayPal refund/top-up
```

---

## What is real vs. demo data

| Real, working | Demo / simulated (clearly labeled in the UI) |
|---|---|
| PayPal **Orders v2** create + capture, **Payments v2** refund + capture lookup (sandbox) | The ship *Aurora Tide*, its sailing and timetable (fictional; port names are real places) |
| Server-side price, currency, amount and `custom_id` verification before any booking changes | Tours, guides, vehicles, meeting points, prices, inventory |
| LLM concierge with structured **tool calling** (Gemini) | Ship delays: triggered by a labeled demo control; no live ship tracking |
| **LastBoard**: deterministic feasibility + rescue planning | Operator "Tidewalk Tours" |
| Persisted bookings, payments, rescue proposals and an **audit trail** | |
| Anonymous engagement events (allow-listed, no PII) | |

If PayPal or the LLM is not configured, the app says so. It never simulates a payment, and the concierge shows "Offline mode" instead of pretending to be AI.

---

## Built for judges

- **Live proof drawer** (header → *Live proof*): shows the real evidence behind each screen: PayPal order/capture/refund ids and statuses, Gemini model + the exact tool calls it made, LastBoard numbers, and the server audit trail for your verified booking. Each item is labeled *live API*, *deterministic engine* or *fallback*.
- **Port-day clock** on the homepage runs the real LastBoard engine in the browser: toggle "on time" vs "+90 min late" and watch which tours still fit.
- **Trip Rescue replay**: an animated sequence driven by the stored LastBoard result (ship slips, tour fails with its reason, the alternative glides in, the refund counts up).
- **Shore Pass**: shareable confirmation with PayPal's recorded capture status stamped on it.
- **Operator KPIs** computed from PayPal-verified payment records.

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in PayPal sandbox + Gemini keys
npm run dev                  # http://localhost:3000
npm test                     # unit + service tests (Vitest)
```

Requirements: Node 20+. Sandbox credentials: developer.paypal.com → Apps & Credentials → **Sandbox** → Create App. Use a sandbox *personal* (buyer) account to approve payments.

> **Windows note:** if the project lives in a very deep folder, Turbopack's dev cache can exceed the Windows path limit. `npm run dev` therefore uses webpack; `npm run build` still uses Turbopack.

---

## Reproducible demo (≈3 minutes)

1. **Home**: the intro plays once per session (skippable). Migo waves; his tip offers Adventure Match.
2. **Adventure Match**: pick *Cozumel · Under the sea · Balanced · 2 guests* to get grounded recommendations with reasons.
3. **Ask Migo**: "Find me a reef snorkel in Cozumel". The panel shows which tools ran.
4. Open **Palancar Reef Morning Snorkel**. The LastBoard timeline shows it fits (tight margin). Reserve for 2 guests.
5. **Checkout** (neutral scene; Migo docks and ambience mutes) → PayPal sandbox approval → server capture → verification.
6. **My trip**: sunset reveal; Migo celebrates only now. Payment evidence shows PayPal's capture status.
7. **Simulate ship delay → 90 minutes** (demo control). LastBoard marks the tour infeasible (ready at 10:20 for a 9:15 departure). Migo turns concerned.
8. Open **/operator** → *Trip Rescue reviews* → **Approve & release options**. The schedule shows the conflict in red.
9. Back on **My trip**, choose *Afternoon Reef & Sandbar* (1:00 PM), tick consent, and approve. A $20.00 PayPal refund runs, the booking becomes *Rebooked*, and the audit trail records every step.

Tip for single-presenter demos: set `RESCUE_SKIP_OPERATOR_REVIEW=true`.

---

## Architecture

```
src/
  lib/domain/          pure, tested business logic (no I/O)
    catalog.ts         demo sailing, ports, excursions, guides, vehicles, policy
    feasibility.ts     LastBoard feasibility engine
    rescue.ts          LastBoard rescue planner (ranked alternatives + refund option)
    match.ts           Adventure Match scorer
    schedule.ts        operator schedule model (Bryntum-compatible resources/events)
  lib/server/          server-only
    store.ts           persistence boundary (JSON file adapter, serialized transactions)
    bookings.ts        booking state machine, PayPal flows, disruption, rescue, audit
    paypal.ts          PayPal REST client (sandbox), capture verification
    session.ts         HMAC-signed booking-verification cookie, operator gate
  lib/concierge/
    tools.ts           approved, read-only LLM tools
    engine.ts          Gemini tool-calling loop + deterministic offline fallback
  components/
    scene/             scene lighting controller + full-bleed vector environment
    migo/              event bus, state machine, 2.5D renderer, stage
    concierge/         AI concierge panel
    transition/        "tide" route transitions
    audio/             Web Audio engine (synthesized, opt-in)
  app/                 pages + API routes
```

### Booking state machine

```
pending_payment ──capture verified──▶ confirmed ──delay makes it infeasible──▶ disrupted
      │ (15-min hold expires)                                             │
      ▼                                         operator review → customer approval
   expired                                     ├─ switch, cheaper → refund diff  ─▶ rebooked
                                               ├─ switch, pricier → PayPal top-up ─▶ rebooked
                                               └─ cancel          → full refund   ─▶ cancelled_refunded
```

### PayPal integration

- `POST /api/bookings` validates the excursion, guests, LastBoard feasibility and seats, and computes the total from the catalog. Client-sent prices are ignored.
- `POST /api/bookings/:id/order` → Orders v2 `CREATE` (intent `CAPTURE`, `custom_id` = booking id, `PayPal-Request-Id` idempotency key).
- The PayPal JS SDK opens PayPal's own approval UI.
- `POST /api/bookings/:id/capture` → Orders v2 capture, then `verifyCapturedOrder` checks `COMPLETED` status, `custom_id`, `USD` currency and exact amount. Only then does the booking become `confirmed`.
- Duplicate capture: replay returns the stored booking; `ORDER_ALREADY_CAPTURED` triggers a `GET` of PayPal's real order state. `INSTRUMENT_DECLINED` restarts the buyer flow.
- Refunds go through Payments v2 `captures/:id/refund` with idempotency keys. The UI shows PayPal's exact refund status and never says "completed" unless PayPal does.
- Operators can **Re-verify with PayPal**, which re-reads each capture and reports drift.
- Webhooks are not implemented yet; state is verified synchronously against API responses.

### AI concierge (Migo)

- Server-side only (`/api/concierge`); the key never reaches the browser.
- Tools: `search_excursions`, `get_excursion_details`, `get_port_schedule`, `get_policies`, `adventure_match`, `prepare_booking`, `get_my_booking`, `get_payment_status`, `get_trip_rescue`.
- **No mutating tools.** `prepare_booking` returns a quote card (`charged: false`); the customer continues to checkout and pays in PayPal themselves. Rescue changes require an explicit consent checkbox and `confirm: true` on the API.
- Booking and payment tools require a verified booking session (reference + last name, or a completed checkout).
- Timeout (`LLM_TIMEOUT_MS`), HTTP errors or empty output fall back to the deterministic offline concierge, labeled in the UI.
- System prompt forbids invented prices, scarcity, discounts, testimonials, guarantees and unverified success claims. Migo discloses that he is an AI.

### LastBoard (itinerary safety engine)

```
ready   = arrival + delay + disembark (30 min, +25 at tender ports) + transfer
departs = fixed start, or max(earliest, ready) for flexible tours
back    = departs + duration + return transfer
feasible ⇔ ready ≤ departs  ∧  back ≤ all-aboard − 60-min buffer
tight    ⇔ feasible ∧ margin < 30 min
```

Rescue ranks feasible same-port alternatives with enough seats by same category, then margin, then price proximity, and always offers a full refund. It is a planning aid built on demo timings, **not** a return-to-ship guarantee.

### Scene-aware visual rendering

- **One lighting state for the whole world.** `SceneProvider` keeps a stack of scene claims (the route's base scene plus sections in view) and writes the top one to `<html data-scene>`.
- Each scene (`day`, `shade`, `sunset`, `night`, `neutral`) sets ~35 CSS custom properties: sky, sun position and size, sea, glitter, land rim light, UI surfaces, ink, accent, and Migo's lighting. They are registered with `@property`, so the browser **interpolates** them, and the sky, sea, cards and Migo relight together over 750 ms.
- **Environment** (`SceneBackdrop`): original vector layers (sky gradient, stars, sun with bloom, sun-under-lit clouds, islands with atmospheric perspective, ship silhouette, sea, glitter path, wave lines, mist, rim-lit palms). Animation uses transforms and opacity only; pointer parallax writes two CSS variables; palms use scroll parallax.
- **Migo lighting** (`SpriteMigo`) is honest 2.5D image-space compositing on flat artwork, not physically based 3D:
  1. grounding shadow: color, opacity and skew from the scene (long and cool at sunset)
  2. base sprite brightness and saturation
  3. ambient tint, soft-light, masked to his silhouette
  4. rim light: an edge band on the lit side (silhouette minus itself offset away from `--rim-angle`)
  5. compass glow: pulsing; strongest at night, where it acts as a lantern
  6. water reflection: a flipped, faded copy whose strength follows `--glint-a`
- **Signature sunset**: the low sun sits on the horizon behind the ship silhouette, with an amber glitter path, coral-to-indigo sky, magenta-tinted sea, warm rim light on palms and Migo, and champagne UI accents.
- **Swap path to 3D:** renderers consume `{pose/expression, facing, size}` from the Migo state machine. A GLB renderer (React Three Fiber) would map expressions to animation clips and read the same scene variables for light color and direction.

### Migo character system

- `bus.ts`: application code emits facts (`booking:verified`, `concierge:thinking`, `disruption:detected`…). Events are delivered after the React commit.
- `machine.ts`: a pure, unit-tested reducer. Modes: `roam`, `attend`, `docked`, `hidden`. Expressions: idle, walking, greeting, curious, listening, thinking, suggesting, excited, celebrating, concerned, guiding.
- He celebrates **only** on `booking:verified` / `rescue:resolved`, which are emitted after server-verified PayPal results.
- He docks during checkout, form focus and on the operator console. Tips avoid elements marked `data-migo-avoid` and are never shown in checkout. On phones he is a compact corner launcher.
- Visitor controls: hide/show, pause animations, turn tips off, sound settings. `prefers-reduced-motion` is respected.
- Blinking is not implemented: the supplied artwork has no separate eye layer.

### Sound

All audio is synthesized in the browser (Web Audio): surf, breeze and distant birds; a pentatonic scene motif; and Migo blips for greet, curious, excited, listen, success, concern and resolve. It is **off by default**, with separate ambience, character and volume controls. Ambience ducks during checkout.

### Engagement events

`POST /api/events` accepts an allow-listed set of event types with short scalar props (ids, page, counts). No names, emails, free text or cookies. Counts are visible under Operator → Engagement.

---

## Performance & accessibility

- Environment is CSS/SVG (no hero images to download); sprites are WebP at about 40 KB each.
- Animations use compositor-friendly properties; the intro runs once per session and never blocks rendering.
- Reduced motion: scene changes become instant, ambient animations stop, Migo stops walking, and route transitions are skipped. A manual "Pause animations" toggle does the same.
- Keyboard: skip link, focus-visible rings, Migo is a real `<button>`, Escape closes panels, and the concierge returns focus to Migo.
- Status regions use `aria-live`; switches use `role="switch"`.

---

## Deployment

**Storage.** Locally the app uses a JSON file (`.data/db.json`). When `DATABASE_URL` is set it uses **Postgres** instead (Supabase or Neon). The state is one JSONB row, and every transaction locks it (`SELECT … FOR UPDATE`), so capacity checks stay atomic across serverless instances and roll back on error. Vercel **requires** `DATABASE_URL`; the app refuses to fall back to a per-instance `/tmp` file there. The single-document design suits a demo-scale dataset; `supabase/schema.sql` is the normalized schema for a production build.

**Vercel (sandbox only)**
1. Create a Postgres database (Supabase free tier: Project → Connect → *Transaction pooler* URL, port 6543).
2. `vercel link`, then add these environment variables (Production): `DATABASE_URL`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` (sandbox app), `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODELS`, `SESSION_SECRET` (32+ random chars), `OPERATOR_PASSCODE`.
3. `vercel deploy --prod`.

The PayPal API base is hard-coded to `api-m.sandbox.paypal.com`; there is no live-mode switch. Set a quota or budget on the Gemini key, since public visitors can use the concierge. Free-tier quotas are per model; the hosted demo runs `gemini-flash-lite-latest` with `gemini-3.6-flash` as fallback because the 3.6-flash quota was exhausted during testing. If the quota is hit, Migo falls back to labeled offline mode.

---

## Testing

`npm test` runs Vitest:

- LastBoard feasibility (fixed, flexible, tender, buffer, validation), rescue ranking, seat filtering, refund-only fallback, schedule conflicts, money formatting
- Migo state machine (celebrate only after verification, docking, attention)
- Adventure Match filtering (feasibility, seats, budget, time, port)
- Operator inventory: capacity floor (confirmed + held), vehicle cap, close/reopen sales, hold expiry, audit
- Postgres adapter (`tests/postgres-store.test.ts`, runs when `PG_TEST_URL` is set): persistence, rollback, no oversell under concurrency
- Booking + PayPal service flows against a **fake PayPal test double** (`tests/fake-paypal.ts`): server pricing, oversell protection, idempotent capture, `ORDER_ALREADY_CAPTURED` recovery, amount mismatch, `INSTRUMENT_DECLINED`, not-configured, refunds (including `PENDING`), top-ups, operator rejection, audit trail
- Concierge: verification gating, no-charge `prepare_booking`, Gemini tool loop with a mocked API, invalid output, timeout, offline fallback

The fake PayPal double tests our logic only.

**Live PayPal sandbox evidence (2026-11-11):** a full create → buyer approval → capture → duplicate-capture protection → decline → retry → Trip Rescue partial refund ($20) → full refund ($178) cycle passed, with every status read back from PayPal. Order, capture and refund ids are in [docs/VERIFICATION.md](docs/VERIFICATION.md). Buyer approval used PayPal's guest card checkout with PayPal's documented sandbox test card; a logged-in sandbox Personal wallet approval was not automated.

**Live smoke test:** `npm run smoke -- http://localhost:3000 --operator-passcode=YOUR_PASSCODE` hits the real API routes and, when keys are configured, the real Gemini API and PayPal sandbox (order creation, idempotent re-creation, capture refused before approval). Buyer approval is a manual step in PayPal. Evidence is logged in [docs/VERIFICATION.md](docs/VERIFICATION.md); submission materials are in [docs/SUBMISSION.md](docs/SUBMISSION.md).

---

## Assets & licensing

Code is MIT (`LICENSE`). The Migo artwork was created by the ShoreMigo team with an AI image tool and is **not** MIT-licensed. Environment art, excursion art and audio are original; fonts are SIL OFL. Full terms and the dependency audit are in [ASSETS.md](ASSETS.md).

## Bryntum

The operator schedule is an in-house timeline over a Bryntum-compatible `resources/events` model (`lib/domain/schedule.ts`), computed live from bookings and simulated disruptions. Bryntum Scheduler is a commercial package that requires licensed (or trial) registry access, which this repo does not assume. Once access is confirmed, the view can be swapped without changing the data model.


### Cinematic Luxury · Phase 1

The welcome and homepage now use locally hosted, licensed illustrative photography, a navy/ivory/champagne palette, and the original Migo wave artwork. Country and language remain independent; choices are session-only unless the visitor opts into remembering them. Skip/Escape, keyboard focus containment/restoration, reduced motion, and the manual pause setting are supported. Fonts are bundled locally with their OFL licenses; builds no longer fetch Google Fonts.

Scene lighting and sunset photography interpolate over **750 ms**. Sections claim a scene when entering a central viewport band so tall mobile sections still activate it. Booking, payment, concierge, inventory, operator and Trip Rescue logic are unchanged.

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. For browser regression tests, install Chromium with `npx playwright install chromium`, run the production server, then `npm run test:ui`. Set `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium` to use an existing system Chromium. Set `CAPTURE_PREVIEWS=1` to save responsive review screenshots in `docs/previews/`. See [Phase 1 review](docs/CINEMATIC_PHASE_1.md) and [asset provenance](ASSETS.md).


### Cinematic Luxury · Phase 1.5

The shared fictional Aurora Tide environment, contact-driven Migo motion/audio, responsive captures, actual browser recording and remaining rig limitations are documented in [the Phase 1.5 review](docs/CINEMATIC_PHASE_15.md). Assets and business logic from Phase 1 are preserved; this update does not deploy or merge the redesign.

# Verification log

Evidence only. "Mocked" means a test double; "live" means a real external API.

## 2026-11-10: audit without credentials

No `.env.local` existed, so **no live PayPal or live Gemini success has been verified yet.**

### Automated tests: `npm test` (Vitest)
- 4 files, **52/52 passing**. The booking and PayPal flows run against `tests/fake-paypal.ts` (**mocked**). The Gemini tool loop runs against a stubbed `fetch` (**mocked**).

### Live HTTP smoke test: `node scripts/smoke.mjs http://localhost:3200 --operator-passcode=…`
Production build (`next start`) with `OPERATOR_PASSCODE` set, PayPal **unset**, and `GEMINI_API_KEY` **deliberately invalid**. Result: **17/18 passed**. The single failure was the expected "Gemini answered live" check.

| Check | Result | Evidence |
|---|---|---|
| Adventure Match (real API route) | PASS | top: coz-palancar-snorkel, coz-afternoon-reef, coz-punta-sur |
| Gemini reachable / failure path (**live**) | PASS (as failure test) | Google returned `400 INVALID_ARGUMENT "API key not valid"`; route fell back to the offline concierge, flagged `degraded: true` |
| Purchase intent → uncharged quote at server price | PASS | `prepare_booking` card, totalCents 25800 |
| Booking/payment info gated | PASS | verification card returned |
| Invalid guest count | PASS | 400 bad_guests |
| Client-supplied price ignored | PASS | total 6500 despite totalCents=1 |
| Trip changes without verification | PASS | 401 / 401 |
| Forged session cookie | PASS | rejected |
| Wrong last name / unpaid booking can't open a trip | PASS | 404 / 404 |
| Operator API without passcode | PASS | 401 |
| Infeasible booking under simulated delay | PASS | 409 infeasible |
| PayPal not configured → no fake payment | PASS | 503 paypal_not_configured |

### Security / hygiene
- `.env.local`, `.env*`, `.data*/`, `.next*/` are git-ignored (verified with `git check-ignore`); `.env.example` is tracked.
- Git history: one scaffold commit; no key patterns found in history or source (only an npm integrity hash matched the scan).
- Gemini key is sent in the `x-goog-api-key` header (never in URLs or logs). PayPal secret is used only in the server-side token request.
- Security headers added (nosniff, frame, referrer, permissions policy).

### UI
- Desktop 1600×900 and mobile 375×812 screenshots reviewed: hero, sunset scene, excursion, checkout, concierge, operator. Fixed: palm crowding the headline, Migo's tip covering CTAs, mobile button visibility (CSS layer order), Migo docking on direct loads (event timing), React setState-in-render warning.
- Static a11y scan of server HTML (/, /excursions, /excursions/:id, /trip, /operator): no unnamed buttons/links, no images without alt, no unlabeled inputs, `lang="en"`.
- **Not measured:** frame rate and animation performance. The preview pane was hidden during testing, so timing numbers would be unreliable. Check in a visible browser with DevTools Performance before recording.

## 2026-11-10 (later): LIVE run with real sandbox + Gemini keys

`node scripts/smoke.mjs http://localhost:3300 --operator-passcode=…` against a production build reading `.env.local`: **22/22 passed.**

| Check | Result | Evidence |
|---|---|---|
| Gemini live (gemini-3.6-flash), structured tools | PASS | Called `search_excursions` + `get_port_schedule`; reply quoted catalog facts ($89, 9:15 AM, "tight" fit, 16 seats) |
| Gemini multi-step tool chain (browser) | PASS | "Something relaxing at sunset in Ocho Rios" → `get_port_schedule` → `search_excursions({max_intensity:1, port_id:"ocho-rios"})` → `get_excursion_details({excursion_id:"och-sunset-sail"})`; answer: 4:15 PM, $129, back 7:00 PM (all correct). Latency ≈ 9.9 s |
| Gemini privacy gate | PASS | Asked for verification before booking/payment details |
| PayPal sandbox order created | PASS | `8FX67913EX0054130`, status `PAYER_ACTION_REQUIRED` (earlier run: `6U116701UU9741618`) |
| Idempotent re-creation | PASS | Same order id returned |
| Capture before approval | PASS (real PayPal rejection) | 422 `ORDER_NOT_APPROVED`; booking stayed `pending_payment`, paid 0 |
| Wrong order id for booking | PASS | 409 order_mismatch |

**Bugs found only by live testing, now fixed (with regression tests):**
1. `gemini-2.5-flash` returns 404 for new API keys. Default is now `gemini-3.6-flash`, with automatic fallback (`GEMINI_FALLBACK_MODELS`) on 404/429/5xx. During testing `gemini-3.7-flash`/`3.8-flash`/`flash-latest` returned 503 "high demand".
2. Gemini sends human values (`port_id:"Cozumel"`, `category:"snorkeling"`); tools matched only exact ids, so searches would have been empty. Added `normalizeArgs`.
3. Newer Gemini function calls carry an `id`; the response now echoes it.
4. Lightning CSS dropped unprefixed `backdrop-filter` (kept only `-webkit-`), so Chrome rendered no glass blur. Fixed by declaration order and confirmed in compiled CSS.

**Still not verified live:** buyer approval → capture COMPLETED, refund, top-up (needs a sandbox buyer login by a human).

## 2026-11-11: PayPal sandbox end-to-end attempt (browser automation + direct API checks)

All calls went to `https://api-m.sandbox.paypal.com` (hard-coded in `src/lib/server/paypal.ts`; no live switch exists). Sandbox credentials are only in git-ignored `.env.local` and were never printed. Every PayPal status below was read back **independently from PayPal** with a separate script (`GET /v2/checkout/orders/{id}`), not just from the app. No mocks were used in this section.

### Sandbox-only configuration
| Check | Result |
|---|---|
| Server API base | `api-m.sandbox.paypal.com` only (constant) |
| Credentials | Accepted by the sandbox OAuth endpoint (a live client id would be refused there) |
| Seller (payee) on orders | default sandbox business account, merchant `G37Y8N47AAGLN`, `@business.example.com` |

### Results
| # | Test | Result | Evidence (real sandbox) |
|---|---|---|---|
| 1 | Booking via UI, server-side price | PASS | `SM-ZJ8EF`, 2 × $89.00 = $178.00 |
| 2 | Order creation | PASS | `6M425404UY501762B`, `5VM67506GB5088749`, `21K500574L414502M` (status `PAYER_ACTION_REQUIRED`) |
| 3 | Duplicate order request (idempotency) | PASS | two requests → same `21K500574L414502M` |
| 4 | Buyer approval (PayPal card guest checkout, PayPal-documented test Visa 4012 8888 8888 1881, fake test identity) | PASS | PayPal reports order `APPROVED`, payer country US, 178.00 USD, custom_id = booking id |
| 5 | **Capture** | **BLOCKED by the sandbox seller account** | 422 `COMPLIANCE_VIOLATION` (debug ids `f683554b4276e`, `f10110146c2ad`) with both a generic and a PayPal-documented test card. Order stays `APPROVED`; no capture exists, so no sandbox money moved |
| 6 | Failed capture handling | PASS | booking stays `pending_payment`, paid $0, no payment record, buyer sees PayPal's message |
| 7 | Capture before buyer approval | PASS | PayPal 422 `ORDER_NOT_APPROVED`; booking unpaid |
| 8 | Capture with another booking's order / a fabricated order id | PASS | 409 `order_mismatch` (PayPal never called) |
| 9 | Client-supplied price (`totalCents: 1`) | PASS | ignored; server total $65.00 |
| 10 | Holds reduce live inventory | PASS | Palancar 16 − 3 active 2-guest holds = 10 open; Cacao 20 − 2 = 18; older expired holds not counted |
| 11 | Hold expiry releases seats (live) | PASS | Palancar 10 → 12 open at 05:46:08Z, after hold `SM-ZJ8EF` (created 05:30:25Z) passed 15 min; nothing else changed |
| 12 | Refund / Trip Rescue refund | NOT RUN | needs a completed capture (blocked by #5) |
| 13 | Buyer closes the PayPal window | NOT RUN in the app pane (popups don't open there); the resulting server state is covered by #7 and #10/#11 |

### Bugs found by this live run, fixed with regression tests
1. **Retry after a refused capture was impossible.** Order creation reused `PayPal-Request-Id: create-<booking>`, so after a failed capture PayPal replayed the dead order (`ORDER_ALREADY_CAPTURED` on the second click) and the buyer was stuck until the hold expired. A non-retryable capture failure now clears the dead order, and the next checkout uses a fresh key (`create-<booking>-r<n>`). `INSTRUMENT_DECLINED` keeps the same order, as PayPal intends. Test: `tests/inventory.test.ts` → "refused capture recovery". Live re-check pending the seller fix.
2. **Failed captures left no audit trail.** Now recorded as `paypal.capture.failed` with PayPal's issue code and debug id (verified live: `COMPLIANCE_VIOLATION`, `f10110146c2ad`).
3. Operator console kept polling `/api/operator/overview` every 5 s while signed out (401 flood). It now stops until sign-in.

### Needs the owner (automation can't do this)
- **Fix the sandbox seller account.** developer.paypal.com → Testing Tools → Sandbox Accounts → create a **Business** account with country **United States** → Apps & Credentials → Sandbox → create an app linked to that business account → put its client id/secret in `.env.local`. Then rerun #4–#5 and the refund steps.
- Optional: approve once by logging in with the sandbox **Personal** account in PayPal's own window (automation does not enter passwords).

## 2026-11-11 (later): full sandbox payment + refund cycle PASSED on the new US seller account

The owner created a new US sandbox Business account and REST app (credentials only in `.env.local`). The new credentials can't see the old orders (404), which confirms a different merchant. Seller on every order below: merchant `QLPRBDFBW79U4`. **The COMPLIANCE_VIOLATION above was the old seller account; it did not recur.** Buyer approval used PayPal's card guest checkout with PayPal's documented sandbox Visa and a fake identity. Every status was re-read from PayPal by an independent script.

| # | Test | Result | PayPal evidence (read back from PayPal) |
|---|---|---|---|
| 1 | New order → buyer approval → server capture (`SM-MS225`, 2 × $89) | PASS | order `1SE241003H9223117` `COMPLETED`; capture `7AA24246WA9507806` `COMPLETED` 178.00 USD; custom_id = booking id |
| 2 | Booking paid, inventory committed | PASS | booking `confirmed`, paid $178.00, 1 payment record; the hold became committed seats (Palancar 14/16 open, unchanged) |
| 3 | Duplicate capture: 2 sequential + 3 parallel replays | PASS | all 200 with the same booking; still **1** local payment and **1** capture at PayPal |
| 4 | New order on a paid booking / foreign order id | PASS | 409 `bad_state` / 409 `order_mismatch` |
| 5 | Declined payment (`CCREJECT-REFUSED`, `SM-VC93A`) | PASS | PayPal 422 `INSTRUMENT_DECLINED`, debug id `f8252418b8c7c`; booking unpaid; audited as `paypal.capture.failed` |
| 6 | Retry after the decline (same booking, page reload) | **FAILED first, fixed, then PASS** | first retry hit PayPal `ORDER_ALREADY_CAPTURED` (spent order + reused idempotency key). After the fix: audit `capture.failed > order.replaced > order.created > capture.verified`; new order `0T454951WM4020632` `COMPLETED`, capture `04Y63015WU051620V` 178.00 USD |
| 7 | Simulated 90-min delay (operator) | PASS | both bookings `disrupted`; LastBoard offered Afternoon Reef (−$20), Punta Sur (+$60), Cacao (−$48), full refund (−$178) |
| 8 | Customer approval without confirmation / before operator review | PASS | 400 "Explicit confirmation is required" / 409 `awaiting_operator`; no money moved |
| 9 | Trip Rescue switch: operator approves → customer picks Afternoon Reef | PASS | refund `6X5600853W843645J` `COMPLETED` 20.00 USD; capture now `PARTIALLY_REFUNDED`; booking `rebooked`, net paid $158.00 |
| 10 | Trip Rescue cancel: customer picks full refund | PASS | refund `1PC89064GD524790R` `COMPLETED` 178.00 USD; capture now `REFUNDED`; booking `cancelled_refunded`, paid $0 |
| 11 | Replay of either approval | PASS | 404 `no_proposal`; no second refund |
| 12 | Inventory after rescue | PASS | Palancar back to 16/16 open (both parties left); Afternoon Reef 14/16 (2 moved in) |

**Code fix from #6:** `startCheckout` now asks PayPal for the pending order's state and reuses it only while it's `CREATED`/`PAYER_ACTION_REQUIRED`. Otherwise it records `paypal.order.replaced` and creates a fresh order with a new idempotency key. The test double now mirrors PayPal's live behavior (a declined order is `APPROVED`). Tests: "a declined card…", "an order still awaiting the buyer is reused".

**Not covered:** approval through a logged-in sandbox **Personal** wallet (automation doesn't enter passwords; the card path exercises the same create → approve → capture → refund API flow); buyer closing the PayPal popup (popups don't open in the automation pane); the top-up (customer pays more) rescue path.

**Regression after these runs:** `tsc` OK · Vitest **67/67** · lint 0 errors · production build OK (20/20 pages) · secret scan 0 hits across 98 files. The simulated delay was cleared afterwards.

## Earlier checklist (superseded by the table above)

| Step | Expected | Actual |
|---|---|---|
| `npm run smoke -- http://localhost:3000 --operator-passcode=…` | 20+/20+ incl. "Gemini answered live" | |
| PayPal order created | `orderId=…`, status `CREATED` | |
| Repeated order creation | same orderId | |
| Capture before approval | refused by PayPal (`ORDER_NOT_APPROVED`) | |
| Buyer approval (sandbox personal account) → capture | booking `confirmed`, capture `COMPLETED`, amount 178.00 USD | |
| Operator → Re-verify with PayPal | "PayPal says COMPLETED, amount matches" | |
| Simulate 90-min delay → operator approve → switch to Afternoon Reef | refund 20.00 USD, status `COMPLETED`, booking `rebooked` | |
| Cancel option on another booking | full refund `COMPLETED`, booking `cancelled_refunded` | |
| Declined card (sandbox negative testing) | buyer prompted to choose another method; booking stays pending | |
| Gemini tool trace in concierge panel | "checked: search excursions…" with engine Gemini | |

## 2026-11-11: submission readiness checks

- **Secrets:** all git history (2 commits) scanned for every `.env.local` value, Google/PayPal key shapes and private keys: 0 hits. Only `.env.example` (blank values) is tracked. No data stores or logs are tracked. The only real email in history is the commit author metadata (not file content).
- **Postgres adapter** (needed for Vercel): `tests/postgres-store.test.ts` passed 4/4 against real Postgres SQL (PGlite over the Postgres wire protocol): persistence + capture, rollback on error, no oversell under concurrent requests, inventory rules. Re-run against the provisioned database before going live.
- **Regression:** tsc OK · Vitest 67 passed (+4 Postgres tests skipped without `PG_TEST_URL`) · lint 0 errors · production build OK (20/20 pages).
- **Dependency audit:** `npm audit --omit=dev` reports PostCSS ≤8.5.22 nested inside `next` (1 high, 1 moderate). PostCSS runs only at build time on this repo's own CSS, never on user input at runtime; the suggested fix is a forced breaking upgrade, so it's deferred and recorded here.

## 2026-11-11: production deployment (https://shoremigo.vercel.app)

Vercel production + Neon Postgres (via the Vercel Marketplace), PayPal sandbox app on US seller `QLPRBDFBW79U4`. Environment values were copied from `.env.local` into Vercel's encrypted env without being printed.

| Check | Result | Evidence |
|---|---|---|
| Postgres adapter on Neon | PASS | `tests/postgres-store.test.ts` 4/4 against the Neon database (test table dropped afterwards) |
| Cross-instance locking on Neon | PASS | 10 separate connections doing concurrent `SELECT … FOR UPDATE` read-modify-write: final counter 10, no lost updates |
| Live smoke test vs production | PASS 22/22 | validation, server pricing, verification gates, forged cookie, operator passcode, delay infeasibility, sandbox order `59975218C7145304C`, idempotency, `ORDER_NOT_APPROVED` before approval, order mismatch |
| Gemini in production | PASS (after config change) | first `gemini-3.6-flash` → 429 RESOURCE_EXHAUSTED (key quota), so the concierge fell back to labeled offline mode. Switched the Vercel env to `GEMINI_MODEL=gemini-flash-lite-latest` (fallback 3.6-flash); now `engine: gemini`, tool `search_excursions`, correct prices/times, 2–4 s |
| Real sandbox payment on production | PASS | booking `SM-4GZHN` → order `15078595DB1506352` `COMPLETED`, capture `2DT20635YV409640L` 65.00 USD (read back from PayPal); audit `booking.created > paypal.order.created > paypal.capture.verified > booking.confirmed` |
| Pages / headers | PASS | `/`, `/excursions`, tour detail, `/trip`, `/operator` → 200 in < 1 s; HSTS, X-Frame-Options, Referrer-Policy present |
| Desktop 1280×800 / mobile 390×844 | PASS | intro → hero + live LastBoard clock; Explore grid; operator login; mobile header collapses, no horizontal overflow (scrollWidth 390) |

Not re-run on production (verified locally on the same sandbox app, see above): refunds and Trip Rescue. Refunds use the same server code and PayPal app.

## 2026-11-12 UTC: WP-01 isolated package checks (no deployment)

Current package branch: `feat/wp01-cinematic-environment`, integration base `000a837adfa8bf3ed39f05be61e09a4bc3f6df3e`; implementation/evidence commit `a05d0053d1567e0275ced00d8ff3ed40624e1944`. Existing live sandbox/Gemini/database evidence above is preserved; it was **not rerun or replaced** by this local package verification.

- Unit: **84 passed, 4 Postgres integration skipped** without `PG_TEST_URL`.
- Graphical browser: **25 passed**, serial headed system Chromium on virtual Xorg software display, using a fixed production build. Covers previous preference/navigation/Migo/checkout checks and seven native-media failure/accessibility/phase cases with clearly marked QA film patterns.
- **17/17 local real HTTP smoke checks** passed using isolated demo data. PayPal was unconfigured and Gemini concierge offline. No new live provider payment/refund/AI or database success is claimed.
- TypeScript, ESLint and production build passed; lint retains three original sprite `<img>` warnings. Protected server/domain/payment/AI/Migo/audio/original-art/submission boundaries have no diff against the integration base.
- [Actual interim recording, responsive screenshots, performance, source/asset hashes and full limitations](signature/VERIFICATION.md). The 27.7-second muted browser recording uses a **static concept**, not accepted moving-water footage. Virtual-browser still-only performance is not a final-film or physical-device benchmark; nonzero observed layout shifts are recorded.
- `media:check` intentionally exits **2 / BLOCKED** because matching production daylight/sunset footage is absent. [Exact source/asset handoff](signature/ASSET_PRODUCTION_SPEC.md).

Independent Claude review and final cinematic visual acceptance remain pending/blocked respectively. No integration/main merge or production deployment occurred. [Shared handoff](HANDOFF.md).

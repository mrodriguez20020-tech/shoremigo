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

## To do once sandbox keys exist (fill in actual values)

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

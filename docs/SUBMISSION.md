# Devpost submission draft: ShoreMigo

> Draft. Finish only after `docs/VERIFICATION.md` shows live PayPal sandbox and Gemini evidence. Re-check the official rules at paypalaihackathon.devpost.com/rules in a browser (automated fetch is blocked).

## Tagline
Your adventure doesn't stop when plans change.

## Elevator pitch (≤200 chars)
An AI cruise companion that finds shore excursions that fit your ship's real schedule, books them with PayPal, and rescues your day, with your approval, when the ship runs late.

## Inspiration
Cruise passengers get a few fixed hours in each port. Tour operators juggle guides, vehicles and payments around ship timetables they don't control. When an arrival slips, someone has to work out what still fits, rebook, and settle the money correctly. We wanted that moment to feel cared for instead of chaotic. *(We don't quote industry statistics here; real-world impact would need validation with operators.)*

## What it does
- **Discover & personalize:** Migo's Adventure Match and an AI concierge recommend tours from real inventory.
- **Validate:** LastBoard, a deterministic engine, checks every tour against arrival, all-aboard, disembark time, transfers and a 60-minute safety buffer.
- **Book:** PayPal Orders v2 sandbox checkout. The server sets the price, verifies status, amount, currency and booking id on capture, and only then confirms.
- **Adapt & recover:** a labeled demo control simulates a ship delay. LastBoard flags the conflict and ranks feasible alternatives, Migo explains them, the operator reviews resource impact, and the customer approves. PayPal Payments v2 refunds the difference, or a new order collects a top-up. Every step lands in an audit trail.
- **Operate:** a schedule of guides and vehicles built from live bookings shows conflicts, plus rescue reviews and PayPal re-verification.

## How we built it
Next.js 15 (App Router) + TypeScript, Tailwind v4, Motion. Gemini 2.5 Flash with function calling over 9 read-only tools. PayPal REST (Orders v2, Payments v2) with idempotency keys. Pure, tested domain modules (LastBoard, rescue planner, Adventure Match, schedule model). A scene-lighting system built on registered CSS custom properties relights the original vector environment, the UI and Migo together. Audio is synthesized with Web Audio. Vitest covers the logic, and a live HTTP smoke script exercises the real routes.

## What makes the PayPal + AI integration meaningful
- The AI never touches money. It can only *prepare* a booking. Charges, refunds and booking changes require explicit customer action, and PayPal's API response is the source of truth.
- Payment truth flows back into the AI: `get_payment_status` reads live capture status, so Migo can answer "was I charged?" accurately, after the customer verifies their booking.
- Agentic commerce with guardrails: recommendation → prepared cart → customer-approved PayPal checkout → AI-explained recovery → customer-approved PayPal refund or top-up.

## Challenges
- Making an AI assistant helpful without letting it invent availability, prices or payment outcomes.
- Idempotent, verifiable payment state transitions (duplicate captures, already-captured orders, declined instruments, pending refunds).
- Making a 2D character feel lit by the world without pretending it's 3D.
- Our own sample data double-booked a guide and boat, which the schedule-clash test caught.

## Accomplishments
*(Fill in after live verification: e.g., "end-to-end sandbox capture and partial refund verified".)*

## What's next
Supabase persistence adapter; PayPal webhooks; Bryntum Scheduler (pending license access); live ship-position feeds from cruise-line partners; the ShoreMigo Crew creator/referral program; a rigged 3D Migo.

## Built with
nextjs, react, typescript, tailwindcss, motion, gemini, paypal-orders-v2, paypal-payments-v2, web-audio, vitest

## Testing instructions for judges
1. Hosted demo: **https://shoremigo.vercel.app** (PayPal **sandbox** only; no real money). Source: https://github.com/mrodriguez20020-tech/shoremigo.
2. Pay with a PayPal sandbox buyer account, or choose **Debit or Credit Card** in the PayPal button and use PayPal's published sandbox test Visa `4012 8888 8888 1881`, any future expiry, CVV `123`, any name, ZIP `95131`.
3. Operator console: `/operator`, passcode `<shared in the private judging field>`.
4. Follow README → "Reproducible demo". The demo state is shared: if a Cozumel delay is already active from another visitor, use Operator → **Clear** next to Cozumel.
5. Demo data notice: the ship, sailing, operator, tours and prices are fictional; delays are simulated; payments are sandbox. Verified sandbox transaction evidence: `docs/VERIFICATION.md`.

## 3-minute video plan

The precise script with voice-over and recording checklist is in [docs/DEMO_SCRIPT.md](DEMO_SCRIPT.md).
| Time | Shot | Proof shown |
|---|---|---|
| 0:00–0:20 | Intro horizon reveal → daylight hero, Migo waves | Brand, problem in one line |
| 0:20–0:50 | Adventure Match → ask Migo; panel shows "checked: search_excursions" (Gemini) | Real AI tool call |
| 0:50–1:20 | Reserve → neutral checkout → PayPal sandbox popup → approve → sunset reveal, Migo celebrates | Real sandbox capture; show capture id suffix + COMPLETED on My trip |
| 1:20–2:10 | "Simulate delay (demo)" → night scene, Migo concerned → LastBoard reasons → "Explain my options" (Gemini) → operator approves → customer approves | Deterministic conflict + AI explanation + approvals |
| 2:10–2:40 | PayPal refund COMPLETED on My trip; operator schedule conflict cleared; audit trail; Re-verify with PayPal | Engineering credibility; label what's simulated |
| 2:40–3:00 | Golden-hour scene, value for operators and travelers, Migo waves | Close |

Recording tips: use a visible browser at 1920×1080 with sound on (opt-in). Keep `RESCUE_SKIP_OPERATOR_REVIEW=false` to show the operator step. Never show `.env.local` or the PayPal developer dashboard secrets on screen.

## Screenshots to capture
1. Daylight hero with Migo. 2. Golden Hour sunset section. 3. Adventure Match results. 4. Concierge with tool trace. 5. Checkout with PayPal buttons. 6. My trip with verified capture. 7. Trip Rescue options (night). 8. Operator schedule with conflict. 9. Audit trail. 10. Mobile hero.

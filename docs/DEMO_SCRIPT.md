# ShoreMigo: 2:50 demo script and recording sequence

Target length **2:50** (hard limit 3:00). Record at 1920×1080, browser zoom 100%, sound **on** in ShoreMigo's settings (it's opt-in). Show only sandbox data. Never show `.env.local`, the Vercel env page or the PayPal developer dashboard.

## Before recording (5 min)
1. Operator console → clear any active delay at Cozumel (**Clear** next to the port), so the demo starts on time.
2. Have a second tab open on `/operator`, signed in with the operator passcode.
3. PayPal approval: either a **sandbox Personal** account (developer.paypal.com → Testing Tools → Sandbox Accounts) or PayPal's guest card form with PayPal's documented sandbox Visa `4012 8888 8888 1881`, any future expiry, CVV `123`, a fake name and ZIP `95131`.
4. Do one full rehearsal. Note the booking ref.
5. Close other tabs and notifications.

## Shot list

| Time | Screen / action | Say (voice-over) | Proof on screen |
|---|---|---|---|
| 0:00–0:15 | Home: intro plays, daylight hero, Migo waves | "Cruise passengers get a few hours in port, and one late ship can wreck a booked tour. ShoreMigo makes shore days that adapt." | Brand, Migo |
| 0:15–0:30 | Port-day clock: toggle **+90 min late** | "Our LastBoard engine checks every tour against arrival, disembark, transfers and a 60-minute return buffer." | Tours turn red/green from the real engine |
| 0:30–0:55 | **Ask Migo**: "Find me a reef snorkel in Cozumel for 2" | "Migo is a Gemini concierge, but it can only use approved tools; prices and seats come from our server." | Tool trace ("checked: search_excursions…"), model name |
| 0:55–1:10 | Open Palancar Reef → timeline "fits, tight margin" → Reserve 2 guests | "Seats are held for 15 minutes; the price is computed on the server." | Seats-open count, hold notice |
| 1:10–1:35 | Checkout → PayPal (sandbox) → approve → lands on **My trip** | "Real PayPal sandbox: create order, buyer approval, server capture. We verify amount, currency and status with PayPal before confirming." | Shore Pass stamp **CAPTURE COMPLETED**, Migo celebrates only now |
| 1:35–1:45 | Header → **Live proof** drawer | "Every claim is backed by the API response." | Order id, capture id, COMPLETED |
| 1:45–2:05 | My trip → **Simulate ship delay: 90 min** (labeled demo) | "The ship is now 90 minutes late, simulated for the demo. LastBoard says this tour no longer fits." | Night scene, Migo concerned, reason text |
| 2:05–2:20 | Operator tab → **Trip Rescue reviews** → Approve & release | "A human operator reviews seats, guides and vehicles before anything is offered." | Schedule conflict in red, audit entry |
| 2:20–2:40 | My trip → choose **Afternoon Reef** → tick consent → Approve | "The customer chooses. The cheaper tour means a $20 refund through PayPal." | Rescue replay, **refund COMPLETED $20.00**, booking *Rebooked* |
| 2:40–2:50 | Operator → Bookings → **Re-verify with PayPal**; then golden-hour close | "Verified with PayPal, fully audited. ShoreMigo keeps the adventure going." | "PayPal says COMPLETED/PARTIALLY_REFUNDED" |

## Disclosures to keep visible or spoken
- Payments are **PayPal sandbox** (no real money). Ship, sailing, operator, tours and prices are fictional demo data; port names are real places.
- Ship delays are **simulated** by a labeled control; there is no live ship tracking.
- If you use the guest-card path, say "PayPal sandbox card checkout" rather than "PayPal wallet".

## If something fails while recording
- Concierge slow (>10 s) or offline: cut the wait in editing; if it shows *Offline mode*, say so; don't claim AI.
- PayPal error: show it. The booking stays unpaid by design. Re-record from Reserve.
- Delay already active from a rehearsal: Operator → **Clear** next to Cozumel, then re-run.

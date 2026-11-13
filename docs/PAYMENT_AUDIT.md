# Payment, inventory, LastBoard and Trip Rescue audit

Branch `feat/shoremigo-product-completion`, 2026-11-12. Scope: `src/lib/server/{bookings,paypal,store,session}.ts`, the booking/trip/operator API routes, `src/lib/domain/feasibility.ts`. Evidence is the unit suite (offline PayPal test double, `tests/fake-paypal.ts`) and the browser suite. **No live sandbox transaction was run in this audit**: buyer approval in the PayPal popup needs a human.

## What holds (verified by code reading and tests)

| Control | Where | Evidence |
|---|---|---|
| Sandbox only: API base is hard-coded to `api-m.sandbox.paypal.com`; no live switch exists | `paypal.ts` | code |
| Price is server-computed from the catalog; client totals ignored | `createBooking` | `booking-flow.test.ts` "prices from the catalog" |
| Idempotency keys on create, capture, refund (`PayPal-Request-Id`) | `startCheckout`, `completeCheckout`, `refundVerified` | booking-flow tests |
| A booking confirms only after the captured order is re-verified (status, custom_id, currency, exact amount) | `verifyCapturedOrder` | amount-mismatch test |
| Refused / declined captures are audited and leave the booking unpaid; declined keeps the order, other refusals start a fresh order | `completeCheckout` | `inventory.test.ts` |
| PENDING refunds are never described as completed | `approveRescue` | booking-flow test |
| No oversell from concurrent bookings or capacity cuts | serialized `tx` | inventory + booking-flow tests |
| Customer trip data requires an HMAC-signed, httpOnly booking cookie; DTO omits email and truncates payment IDs | `session.ts`, `dto.ts` | code |
| Production refuses to run without `SESSION_SECRET` and `OPERATOR_PASSCODE` | `session.ts`, operator login | code |

## Defects found and fixed in this pass

| # | Defect | Impact | Fix | Test |
|---|---|---|---|---|
| 1 | JSON store `tx` mutated the in-memory cache before the callback could throw | partial writes survived a failed transaction and were persisted by the next one; behavior differed from Postgres (rollback) | transactions run on a copy and commit only on success; rejection audits written in their own transaction | `payment-integrity.test.ts` › store transactions |
| 2 | Two concurrent captures of one order each appended a payment | `paidCents` doubled, two charge records for one PayPal capture | final commit is idempotent by order id | › records exactly one payment |
| 3 | An expired hold could still be captured after its seats were resold | oversell, guest charged for a seat that no longer exists | before capture: re-validate seats; renew the hold if free, otherwise expire the booking and refuse **without capturing** | › refuses to capture an expired hold |
| 4 | Concurrent Trip Rescue approvals (double click, two tabs, customer + operator) each refunded/recorded | double refund records, wrong `paidCents`, two different options could both resolve | proposal is claimed inside the serialized transaction before any money moves; switch seats reserved for the claim; claim released if PayPal fails; claims expire after 2 min | › refunds once / two different options / releases the claim |
| 5 | Concurrent top-up captures double-recorded; seats for the switch were not re-checked before capture | double charge record; possible oversell on the alternative | seat re-check before capture (refuse without charging, reopen the choice); idempotent commit | › records exactly one top-up |
| 6 | No webhook path: refunds or reversals made in the PayPal dashboard were invisible | silent drift between PayPal and the app | `POST /api/paypal/webhook`: signature verified by PayPal's API, capture re-read from PayPal, drift audited for the operator, never rewrites money state, idempotent by event id, 503 until `PAYPAL_WEBHOOK_ID` is set | › PayPal webhooks |
| 7 | Operator passcode compared with `===`; unlimited login attempts | timing side channel; brute force | constant-time comparison; 5 failures / 10 min / client throttle (per instance) | code |

LastBoard: added exact-minute boundary tests for all 12 excursions (return cut-off ±1 min, all-aboard extension, last reachable start ±1 min, margin threshold, monotonic in delay). 38 tests, all pass; no rule defect found.

## Open items (not fixed here, by decision or dependency)

- **Live sandbox end-to-end**: first skipped on 2026-11-12; **then run on 2026-11-13 (UTC) on `1e76eb1`**: booking SM-XFYPS, $178.00 capture verified (COMPLETED), 90-min delay, operator approval, traveler consent, rebook to Afternoon Reef & Sandbar, $20.00 refund COMPLETED, PayPal re-verify PARTIALLY_REFUNDED with matching amount. The top-up capture path was not exercised live.
- **Webhook live check** requires registering a sandbox webhook to `/api/paypal/webhook` on a deployed preview and setting `PAYPAL_WEBHOOK_ID`. Not done (no deploy without approval).
- Operator access is one shared passcode with a per-instance throttle. Real multi-operator accounts/roles are a product feature, not in scope.
- `paidCents` is reduced when PayPal accepts a refund, including `PENDING`; the refund record keeps the exact status and the UI never says "completed". Operator re-verify checks captures, not refund status.
- Postgres adapter keeps all state in one JSONB row locked per transaction: correct and serialized, but it does not scale past demo volume. `supabase/schema.sql` is the normalized target.

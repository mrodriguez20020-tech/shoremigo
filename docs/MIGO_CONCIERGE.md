# Migo concierge: grounding and resilience (2026-11-12)

Character side (unchanged, already complete and unit-tested): 11 expressions (`idle, walking, greeting, curious, listening, thinking, suggesting, excited, celebrating, concerned, guiding`) in `src/components/migo/machine.ts`, driven by `concierge:thinking / replied(mood) / error` events, roam/attend/docked/hidden modes, avoidance zones, opt-in sound control, reduced motion.

## Changes in this pass

| Change | Why | Evidence |
|---|---|---|
| **Price grounding guard** (`src/lib/concierge/grounding.ts`): every USD amount in a Gemini reply must equal a tool-returned amount or a tool per-guest price × an allowed guest count; anything else is replaced with "the price shown on the card" and reported as `ungroundedPrices` | prices must come from trusted logic, never the model | unit + end-to-end tests with an invented "$19" |
| Tool output: `on_sale` → `accepting_bookings`, plus `price_type: standard catalog rate (no discounts or promotions exist)`; system prompt states there are no deals | **live finding**: Gemini (gemini-3.6-flash) told a guest the tour was "marked as being on sale, which is the only deal available today" | after fix, two live runs answer "no deals or promotions", prices $89.00 / $267.00 grounded |
| Model chain: a timeout now moves to the next model instead of abandoning the chain | live: cold first calls exceeded the 20 s per-call timeout and dropped straight to offline | unit test; worst case is 20 s × models in chain |
| Offline engine: discount questions get a plain "no promotional discounts" answer | offline engine previously read "discount if I book…" as booking intent and prepared a booking card | unit test |
| Page context passed to the model is limited to same-site paths | client-supplied free text was injected into the prompt | unit test |
| Per-instance throttle: 20 messages/min, 300/day per client (429) | protects the paid model quota from abuse | unit test |

Live checks ran against the existing Gemini key on a local production build (5 requests). No new paid service.

## Open

- Throttle and login limits are per instance (in memory); a shared store is needed for multi-instance hosting.
- Worst-case latency with three models timing out is ~60 s; the panel keeps Migo in "thinking" and falls back to the labeled offline answer.

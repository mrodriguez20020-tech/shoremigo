# ShoreMigo — accomplishments summary for the PayPal AI Hackathon 2026 organizers

Prepared 13 November 2026 to accompany the gallery submission and a request for reconsideration. ShoreMigo was submitted roughly one minute after the deadline; Devpost's current decision excludes it from judging and prizes and permits a gallery entry. Nothing here suggests otherwise, and post-deadline work is identified as such.

## 1. The competition version (preserved, unchanged)

- Git: tag `hackathon-2026-production` and branch `archive/hackathon-2026` → commit `630d0b2` (2026-11-11 10:45:38 −04:00). Production deployment `dpl_cfXiqARjv3btvpmrA4Zarhcc3kV2` still serves `https://shoremigo.vercel.app`. The original demo video and screenshots are archived unmodified.
- What it already did at that commit (from the repository at `630d0b2`):
  - **Migo**, an original character and AI concierge on Google Gemini with tool calling over read-only, approved tools (no tool can charge, refund or change a booking).
  - **LastBoard**, a deterministic engine that checks every excursion against ship arrival, disembarkation/tender time, transfers and the all-aboard safety buffer.
  - **PayPal Sandbox commerce**: server-priced orders, buyer approval, server-side capture verification (status, amount, currency, reference) before a booking is confirmed; refunds through Payments v2.
  - **Trip Rescue**: on a simulated ship delay, infeasible bookings get operator-reviewed alternatives; the traveler consents; price differences are refunded or topped up through PayPal.
  - **Shore Pass** with PayPal's recorded capture status, an **operator console** with KPIs from verified payment records, and a **Live proof** drawer showing the real API evidence behind each screen.

## 2. Continued development after the deadline (not part of the judged version)

Integrated on `feat/shoremigo-product-completion` (87 commits after `630d0b2`), not deployed to production:

- Premium experience: cinematic environments (WP-01), the fictional **Aurora Tide** vessel with nine-deck explorer and Cabin 7214 (WP-02, clearly labeled as a concept), **Taste & Indulge** culinary discovery (WP-04), reef and rainforest discovery with real, attributed footage (WP-05/06), refined Migo motion (WP-07), a multi-experience port-day planner with LastBoard conflict checks (WP-08), editorial photography with honest fallbacks.
- Commerce hardening: transactional rollback; idempotent capture and top-up commits under concurrent submission; expired seat holds re-validated before any capture; Trip Rescue approvals claimed before refunds (no double refunds); signature-verified PayPal webhook reconciliation; operator login hardening.
- AI safety: a server-side **price-grounding guard** removes any dollar amount the model did not get from ShoreMigo's tools; a live-found ambiguity that let the model call a tour "on sale" was fixed.
- Shore Pass QR code resolving to a signed, privacy-preserving verification page that revokes itself on cancellation; print / PDF.
- Accessibility scan (WCAG 2.2 A/AA rules) across 12 routes at desktop and phone width; defects fixed.

## 3. Verified evidence (this showcase)

- **Live PayPal Sandbox lifecycle, recorded 13 Nov 2026 (UTC) on the post-deadline build `1e76eb1`:** booking SM-XFYPS for two travelers, $178.00 captured and verified (COMPLETED); simulated 90-minute delay made Palancar Reef infeasible; operator approved; traveler consented; rebooked to Afternoon Reef & Sandbar; **$20.00 Sandbox refund COMPLETED**; PayPal re-verification: "PARTIALLY_REFUNDED, amount matches"; full audit trail. Sandbox only, no real funds.
- Automated tests: 183 unit tests passing (5 skipped) and a 108-test browser suite (107 passing in the final run; the one failure is a known timing-sensitive media test that passes in isolation).
- Gemini answered live during recording with tool-grounded prices.

## 4. Commercial vision (plans, not traction)

ShoreMigo aims to become a cruise-focused excursion marketplace and AI planning companion: a distribution channel for verified local tour operators, a partner tool for travel advisors and creators, and a potential technology partner for cruise-industry businesses, earning a percentage of completed bookings. Proposed path: private founding-partner launch → onboarding verified operators → advisor and creator partnerships → controlled traveler beta → public launch, with Migo as the brand personality and gradual expansion across cruise destinations.

There are **no** existing partnerships, customers, revenue or live payments today. The ship, operators and inventory in the demo are fictional; ports are real. ShoreMigo was built independently in Trinidad and Tobago.

import "server-only";
import { EXCURSIONS, GUIDES, MEETING_POINTS, POLICY, POLICY_TEXT, PORTS, SAILING, getExcursion, getPort } from "@/lib/domain/catalog";
import { adventureMatch } from "@/lib/domain/match";
import { fmtDuration, fmtMin, fmtUsd, toMin } from "@/lib/domain/time";
import type { Category } from "@/lib/domain/types";
import { availabilitySnapshot, getBooking, openRescueFor } from "@/lib/server/bookings";
import * as paypal from "@/lib/server/paypal";
import { DEMO_VENUE, LOCAL_FLAVOURS, SHIP_VENUES } from "@/lib/domain/dining";

/**
 * Approved, read-only concierge tools. The LLM can only see what these return.
 * There are deliberately NO tools that charge, refund or modify bookings —
 * those require the customer to press a confirmation control in the UI.
 */

export type Card =
  | { type: "excursions"; ids: string[] }
  | { type: "prepare_booking"; excursionId: string; guests: number; totalCents: number }
  | { type: "verify_booking" }
  | { type: "trip"; ref: string }
  | { type: "rescue" };

export interface ToolContext {
  verifiedBookingId: string | null;
  page?: string;
}

export interface ToolOutcome {
  result: unknown;
  cards?: Card[];
  mood?: "excited" | "concerned";
}

const CATEGORIES: Category[] = ["snorkel", "culture", "nature", "adventure", "sail", "food"];

export const TOOL_DECLARATIONS = [
  {
    name: "search_excursions",
    description: "Search ShoreMigo's verified excursion catalog. Returns live price, seats left and ship-schedule feasibility.",
    parameters: {
      type: "object",
      properties: {
        port_id: { type: "string", description: `One of: ${PORTS.map((p) => p.id).join(", ")}` },
        category: { type: "string", enum: CATEGORIES },
        max_price_usd: { type: "number", description: "Per-guest budget" },
        max_intensity: { type: "integer", description: "1 easy, 2 moderate, 3 strenuous" },
      },
    },
  },
  {
    name: "get_excursion_details",
    description: "Full verified details for one excursion: description, meeting point, timing, price, guide languages, feasibility.",
    parameters: { type: "object", properties: { excursion_id: { type: "string" } }, required: ["excursion_id"] },
  },
  {
    name: "get_port_schedule",
    description: "The demo sailing's port calls with arrival, all-aboard time and any simulated delay.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_policies",
    description: "ShoreMigo booking, timing, refund and Trip Rescue policies.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "adventure_match",
    description: "Deterministic matcher: recommends up to 3 feasible, in-stock excursions from stated preferences.",
    parameters: {
      type: "object",
      properties: {
        vibes: { type: "array", items: { type: "string", enum: CATEGORIES } },
        energy: { type: "integer", description: "1 relaxed, 2 balanced, 3 thrill" },
        budget_usd: { type: "number" },
        port_id: { type: "string" },
      },
      required: ["vibes", "energy"],
    },
  },
  {
    name: "prepare_booking",
    description:
      "Prepare (NOT charge) a booking quote when the customer expresses intent to book. Shows a confirmation card; the customer must press it and pay via PayPal themselves.",
    parameters: {
      type: "object",
      properties: { excursion_id: { type: "string" }, guests: { type: "integer" } },
      required: ["excursion_id", "guests"],
    },
  },
  {
    name: "get_my_booking",
    description: "The customer's verified booking (requires booking verification). Returns status and excursion.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_payment_status",
    description: "Live PayPal sandbox status of the verified customer's payments (requires booking verification).",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_trip_rescue",
    description: "The open Trip Rescue proposal for the verified booking, if a simulated delay affected it.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_dining_guide",
    description:
      "Local dish guide (what dishes are, by region), the sample menu of the fictional demo venue Tidewalk Kitchen, and the demo ship's onboard dining. Menus are samples with illustrative prices and are NOT bookable; bookable food experiences come from search_excursions with category 'food'.",
    parameters: { type: "object", properties: { section: { type: "string", description: "optional: breakfast, street, mains, drinks or desserts" } } },
  },
] as const;

function needVerification(): ToolOutcome {
  return {
    result: { error: "verification_required", message: "Customer must verify their booking (reference + last name) first." },
    cards: [{ type: "verify_booking" }],
  };
}

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const CATEGORY_SYNONYMS: [RegExp, Category][] = [
  [/snorkel|dive|diving|reef|underwater|swim/, "snorkel"],
  [/sail|boat|catamaran|cruise|sunset/, "sail"],
  [/food|chocolate|cacao|culinary|cook|eat/, "food"],
  [/culture|heritage|history|music|dance/, "culture"],
  [/adventure|zip|thrill|climb|hike|waterfall/, "adventure"],
  [/nature|eco|wildlife|beach|park|jeep/, "nature"],
];

/**
 * LLMs pass human-friendly values ("Cozumel", "Grand Cayman", "snorkeling",
 * an excursion title). Map them onto catalog ids; drop anything unrecognised
 * rather than guessing.
 */
export function normalizeArgs(args: Record<string, unknown>): Record<string, unknown> {
  const out = { ...args };
  if (typeof out.port_id === "string") {
    const v = fold(out.port_id);
    const p = PORTS.find((x) => x.id === v || fold(x.name) === v || v.includes(fold(x.name)) || v.replace(/\s+/g, "-") === x.id);
    if (p) out.port_id = p.id;
    else delete out.port_id;
  }
  if (typeof out.category === "string") {
    const v = fold(out.category);
    const c = CATEGORIES.includes(v as Category) ? (v as Category) : CATEGORY_SYNONYMS.find(([re]) => re.test(v))?.[1];
    if (c) out.category = c;
    else delete out.category;
  }
  if (Array.isArray(out.vibes)) {
    out.vibes = out.vibes
      .map((x) => (typeof x === "string" ? (CATEGORIES.includes(fold(x) as Category) ? fold(x) : CATEGORY_SYNONYMS.find(([re]) => re.test(fold(x)))?.[1]) : undefined))
      .filter(Boolean);
  }
  if (typeof out.excursion_id === "string" && !getExcursion(out.excursion_id)) {
    const v = fold(out.excursion_id);
    const e = EXCURSIONS.find((x) => fold(x.title) === v || fold(x.title).includes(v) || v.includes(fold(x.title)));
    if (e) out.excursion_id = e.id;
  }
  return out;
}

export async function runTool(name: string, rawArgs: Record<string, unknown>, ctx: ToolContext): Promise<ToolOutcome> {
  const args = normalizeArgs(rawArgs);
  const snap = await availabilitySnapshot();
  const live = (id: string) => snap.find((s) => s.excursionId === id)!;

  const summarize = (id: string) => {
    const e = getExcursion(id)!;
    const s = live(id);
    return {
      id: e.id,
      title: e.title,
      port: getPort(e.portId)!.name,
      category: e.category,
      price_per_guest: fmtUsd(e.priceCents),
      // Catalog rate; ShoreMigo has no discounts or promotions. Stated explicitly so the model cannot infer one.
      price_type: "standard catalog rate (no discounts or promotions exist)",
      starts: e.startMode === "fixed" ? fmtMin(toMin(e.start)) : `flexible, ${fmtMin(toMin(e.start))}–${fmtMin(toMin(e.latestStart!))}`,
      duration: fmtDuration(e.durationMin),
      intensity: e.intensity,
      seats_left: s.seatsLeft,
      // "accepting_bookings", not "on_sale": the model read "on sale" as a discount in live testing.
      accepting_bookings: s.onSale,
      schedule_fit: s.feasibility.status,
    };
  };

  switch (name) {
    case "search_excursions": {
      const list = EXCURSIONS.filter(
        (e) =>
          (!args.port_id || e.portId === args.port_id) &&
          (!args.category || e.category === args.category) &&
          (args.max_price_usd === undefined || e.priceCents <= Number(args.max_price_usd) * 100) &&
          (args.max_intensity === undefined || e.intensity <= Number(args.max_intensity)),
      ).map((e) => summarize(e.id));
      return { result: { count: list.length, excursions: list }, cards: list.length ? [{ type: "excursions", ids: list.slice(0, 4).map((x) => x.id) }] : [] };
    }
    case "get_excursion_details": {
      const e = getExcursion(String(args.excursion_id));
      if (!e) return { result: { error: "not_found" } };
      const s = live(e.id);
      return {
        result: {
          ...summarize(e.id),
          description: e.description,
          highlights: e.highlights,
          meeting_point: MEETING_POINTS[e.portId],
          guide_languages: GUIDES[e.guideId]?.languages,
          feasibility_reasons: s.feasibility.reasons,
          back_at_pier: fmtMin(s.feasibility.timeline.backAtPier),
        },
        cards: [{ type: "excursions", ids: [e.id] }],
        mood: s.feasibility.status === "infeasible" ? "concerned" : undefined,
      };
    }
    case "get_port_schedule":
      return {
        result: {
          sailing: { ship: SAILING.ship, name: SAILING.name, dates: SAILING.dates, note: "Demo sailing (fictional ship)" },
          ports: PORTS.map((p) => {
            const d = snap.find((s) => getExcursion(s.excursionId)!.portId === p.id)?.disruption;
            return {
              id: p.id,
              name: `${p.name}, ${p.country}`,
              date: p.date,
              arrive: fmtMin(toMin(p.arrive)),
              all_aboard: fmtMin(toMin(p.allAboard)),
              tender_port: p.tender,
              simulated_delay_min: d?.delayMin ?? 0,
            };
          }),
        },
      };
    case "get_policies":
      return { result: { policies: POLICY_TEXT, max_guests_per_booking: POLICY.maxGuests } };
    case "adventure_match": {
      const vibes = (Array.isArray(args.vibes) ? args.vibes : []).filter((v): v is Category => CATEGORIES.includes(v as Category));
      const energy = Math.min(3, Math.max(1, Number(args.energy) || 2)) as 1 | 2 | 3;
      const res = adventureMatch(
        { vibes, energy, budgetUsd: args.budget_usd === undefined ? undefined : Number(args.budget_usd), portId: args.port_id ? String(args.port_id) : undefined },
        EXCURSIONS.map((e) => ({ excursion: e, seatsLeft: live(e.id).seatsLeft, feasibility: live(e.id).feasibility.status })),
      );
      return {
        result: { matches: res.map((r) => ({ ...summarize(r.excursionId), why: r.reasons })) },
        cards: res.length ? [{ type: "excursions", ids: res.map((r) => r.excursionId) }] : [],
        mood: res.length ? "excited" : undefined,
      };
    }
    case "prepare_booking": {
      const e = getExcursion(String(args.excursion_id));
      const guests = Number(args.guests);
      if (!e) return { result: { error: "not_found" } };
      if (!Number.isInteger(guests) || guests < 1 || guests > POLICY.maxGuests) return { result: { error: `guests must be 1-${POLICY.maxGuests}` } };
      const s = live(e.id);
      if (s.feasibility.status === "infeasible") return { result: { error: "infeasible", reasons: s.feasibility.reasons }, mood: "concerned" };
      if (s.seatsLeft < guests) return { result: { error: "not_enough_seats", seats_left: s.seatsLeft } };
      const total = e.priceCents * guests;
      return {
        result: { prepared: true, charged: false, title: e.title, guests, total: fmtUsd(total), next_step: "Customer presses 'Continue to checkout' on the card and pays with PayPal." },
        cards: [{ type: "prepare_booking", excursionId: e.id, guests, totalCents: total }],
        mood: "excited",
      };
    }
    case "get_my_booking": {
      if (!ctx.verifiedBookingId) return needVerification();
      const b = await getBooking(ctx.verifiedBookingId);
      if (!b) return needVerification();
      return {
        result: { ref: b.ref, status: b.status, excursion: summarize(b.excursionId), guests: b.guests, total: fmtUsd(b.totalCents), paid_net: fmtUsd(b.paidCents) },
        cards: [{ type: "trip", ref: b.ref }],
        mood: b.status === "disrupted" ? "concerned" : undefined,
      };
    }
    case "get_payment_status": {
      if (!ctx.verifiedBookingId) return needVerification();
      const b = await getBooking(ctx.verifiedBookingId);
      if (!b) return needVerification();
      const out = [];
      for (const p of b.payments) {
        let live_status: string | null = null;
        if (p.kind === "charge" && p.captureId && paypal.paypalConfigured()) {
          try {
            live_status = (await paypal.getCapture(p.captureId)).status;
          } catch {
            live_status = "unavailable";
          }
        }
        out.push({ kind: p.kind, amount: fmtUsd(p.amountCents), recorded_status: p.status, live_paypal_status: live_status, purpose: p.purpose });
      }
      return { result: { environment: "PayPal sandbox", payments: out } };
    }
    case "get_dining_guide": {
      const want = typeof args.section === "string" ? String(args.section).toLowerCase() : "";
      const sections = DEMO_VENUE.sections.filter((s) => !want || s.id === want || s.title.toLowerCase().includes(want));
      return {
        result: {
          source_status: "Dish guide is factual; menus are SAMPLE menus at fictional demo venues with illustrative USD prices. Not bookable. No allergen guarantees.",
          dishes: LOCAL_FLAVOURS.map((d) => ({ name: d.name, region: d.region, what_it_is: d.description })),
          demo_venue: {
            name: DEMO_VENUE.name,
            where: DEMO_VENUE.where,
            menu: sections.map((s) => ({ section: s.title, items: s.items.map((i) => ({ name: i.name, sample_price: fmtUsd(i.priceCents), notes: i.tags ?? [] })) })),
          },
          ship_dining: SHIP_VENUES.map((v) => ({ name: v.name, where: v.where, sections: v.sections.map((s) => s.title) })),
          bookable_food_experiences: EXCURSIONS.filter((e) => e.category === "food").map((e) => e.title),
        },
      };
    }
    case "get_trip_rescue": {
      if (!ctx.verifiedBookingId) return needVerification();
      const r = await openRescueFor(ctx.verifiedBookingId);
      if (!r) return { result: { open_proposal: false } };
      return {
        result: {
          open_proposal: true,
          simulated_delay_min: r.delayMin,
          why_original_fails: r.original.reasons,
          options: r.options.map((o) => ({
            kind: o.kind,
            excursion: o.excursionId ? getExcursion(o.excursionId)!.title : undefined,
            price_change: o.deltaCents === 0 ? "none" : o.deltaCents > 0 ? `+${fmtUsd(o.deltaCents)}` : `refund ${fmtUsd(-o.deltaCents)}`,
            why: o.why,
          })),
          approval: "Customer must approve an option in the Trip Rescue screen.",
        },
        cards: [{ type: "rescue" }],
        mood: "concerned",
      };
    }
    default:
      return { result: { error: `unknown tool ${name}` } };
  }
}

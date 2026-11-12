/**
 * Ships & Rooms domain facade. Every architectural fact comes from the generated adapter
 * (vessel.generated.ts), which is exported from the WP-02 canonical design-control spec, manifest and GLB.
 * Aurora Tide is FICTIONAL: no real cruise line, deck plan or cabin inventory, and nothing here is bookable.
 * The geometry is provisional (under independent review) and schematic, not a production model or render.
 */
import { VESSEL_DATA } from "./vessel.generated";

export const VESSEL = VESSEL_DATA.vessel;
export const VESSEL_SOURCE = VESSEL_DATA.source;
export const PROFILE = VESSEL_DATA.profile;
export const OUTLINES = VESSEL_DATA.outlines;
export const CORES = VESSEL_DATA.cores;
export const CORRIDOR_HALF_WIDTH = VESSEL_DATA.corridorHalfWidth;
export const LOUNGE = VESSEL_DATA.lounge;
export const CABIN_7214 = VESSEL_DATA.cabin7214;

export type DeckInfo = (typeof VESSEL_DATA.decks)[number];
export type Slot = (typeof VESSEL_DATA.slots)[number];
export type Amenity = (typeof VESSEL_DATA.amenities)[number];
export type CabinCategory = (typeof VESSEL_DATA.categories)[number];

/** Decks above the waterline, top deck first (decks 1–2 are machinery and crew levels below the waterline). */
export const DECKS: readonly DeckInfo[] = [...VESSEL_DATA.decks].filter((d) => d.visible).sort((a, b) => b.deck - a.deck);
export const ALL_DECKS = VESSEL_DATA.decks;
export const AMENITIES: readonly Amenity[] = VESSEL_DATA.amenities;
export const REMOVED_AMENITIES = VESSEL_DATA.removedAmenities;
export const CABIN_CATEGORIES: readonly CabinCategory[] = VESSEL_DATA.categories;
export const FUTURE_CONCEPTS = VESSEL_DATA.futureConcepts;
export const SLOTS: readonly Slot[] = VESSEL_DATA.slots;

export const DEMO_SHIP = {
  name: VESSEL.name,
  status: `Fictional vessel · provisional design ${VESSEL_SOURCE.specVersion.replace("-provisional", "")}`,
  intro: `A boutique exploration cruiser for slow Caribbean weeks: ${VESSEL.staterooms} staterooms, each with a sea view, stepped aft terraces and a forward observation lounge.`,
  facts: [
    ["Length", `${VESSEL.lengthM} m · beam ${VESSEL.beamM} m`],
    ["Decks", `${VESSEL.decks} (${DECKS.length} above the waterline)`],
    ["Staterooms", `${VESSEL.staterooms} · ≈${VESSEL.guests} guests`],
    ["Air draft", `${VESSEL.airDraftAboveDWL} m above the waterline`],
    ["Itinerary", "Western Caribbean · 7 nights (demo sailing)"],
  ] as [string, string][],
};

export const DEMO_CABIN = { number: CABIN_7214.number, deck: CABIN_7214.location.deck, category: CABIN_7214.class };

export const deckInfo = (deck: number) => VESSEL_DATA.decks.find((d) => d.deck === deck)!;
export const amenitiesOnDeck = (deck: number) => AMENITIES.filter((a) => a.deck === deck);
export const slotsOnDeck = (deck: number) => SLOTS.filter((s) => s.deck === deck);
export const outlineFor = (deck: number) => (OUTLINES as Record<string, readonly (readonly [number, number])[]>)[String(deck)] ?? [];
export const categoryOf = (slot: Slot): CabinCategory["id"] => (slot.num === Number(CABIN_7214.number) ? "signature-7214" : slot.deck === 4 ? "oceanview" : "premium-balcony");

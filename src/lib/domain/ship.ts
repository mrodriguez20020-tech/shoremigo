/**
 * Demo vessel for Ships & Rooms. Aurora Tide is FICTIONAL: no real cruise line,
 * deck plan or cabin inventory. Nothing here is bookable; the structure is
 * ready for real ships once a cruise-line data source is authorized.
 */

export interface Deck {
  number: number;
  name: string;
  zone: "rooms" | "dining" | "entertainment" | "pool" | "wellness" | "service";
  highlights: string[];
}

export const DEMO_SHIP = {
  name: "Aurora Tide",
  status: "DEMO VESSEL · fictional",
  intro: "A mid-size ship designed for slow Caribbean weeks: wide promenades, an open-air aft deck for sunset, and cabins that put the sea in view.",
  facts: [
    ["Guests", "≈1,900 (illustrative)"],
    ["Decks", "14 (11 shown)"],
    ["Cabin types", "4"],
    ["Itinerary", "Western Caribbean · 7 nights (demo sailing)"],
  ] as [string, string][],
};

export const DECKS: Deck[] = [
  { number: 14, name: "Skywatch", zone: "entertainment", highlights: ["Observation lounge", "Stargazing terrace"] },
  { number: 12, name: "Spa & Fitness", zone: "wellness", highlights: ["Thermal suite", "Fitness studio", "Treatment rooms"] },
  { number: 11, name: "Lido", zone: "pool", highlights: ["Main pool", "Sea Glass Grill", "Kids' splash zone"] },
  { number: 10, name: "Suites", zone: "rooms", highlights: ["Suites", "Suite lounge"] },
  { number: 9, name: "Balcony Staterooms", zone: "rooms", highlights: ["Balcony staterooms (demo cabin 9214)"] },
  { number: 8, name: "Oceanview", zone: "rooms", highlights: ["Oceanview staterooms", "Balcony staterooms"] },
  { number: 7, name: "Interior", zone: "rooms", highlights: ["Interior staterooms", "Self-service laundry"] },
  { number: 6, name: "Promenade", zone: "entertainment", highlights: ["Nightwatch Patisserie", "Shops", "Wraparound promenade"] },
  { number: 5, name: "Atrium", zone: "dining", highlights: ["Compass Rose Dining Room", "Guest services", "Shore Excursions desk"] },
  { number: 4, name: "Theatre", zone: "entertainment", highlights: ["Tidewater Theatre", "Live music lounge"] },
  { number: 3, name: "Gangway", zone: "service", highlights: ["Gangway & tender embarkation", "Medical center"] },
];

export interface CabinType {
  id: "interior" | "oceanview" | "balcony" | "suite";
  name: string;
  occupancy: string;
  beds: string;
  size: string;
  balcony: boolean;
  features: string[];
  walkthrough: boolean;
}

export const CABINS: CabinType[] = [
  { id: "interior", name: "Interior Stateroom", occupancy: "Up to 2", beds: "Two twins convert to a queen", size: "≈170 sq ft (illustrative)", balcony: false, features: ["En-suite shower", "Climate control", "TV", "Wardrobe"], walkthrough: false },
  { id: "oceanview", name: "Oceanview Stateroom", occupancy: "Up to 3", beds: "Queen + sofa bed", size: "≈190 sq ft (illustrative)", balcony: false, features: ["Picture window", "En-suite shower", "Climate control", "Mini-fridge"], walkthrough: false },
  { id: "balcony", name: "Balcony Stateroom", occupancy: "Up to 3", beds: "Queen + sofa bed", size: "≈210 sq ft + balcony (illustrative)", balcony: true, features: ["Private balcony", "Floor-to-ceiling glass door", "En-suite shower", "Climate control", "TV", "Mini-fridge", "Vanity & storage"], walkthrough: true },
  { id: "suite", name: "Tidekeeper Suite", occupancy: "Up to 4", beds: "King + sofa bed", size: "≈400 sq ft + large balcony (illustrative)", balcony: true, features: ["Separate living area", "Bathtub & shower", "Large balcony", "Suite lounge access"], walkthrough: false },
];

export interface CabinView {
  id: "bedroom" | "balcony" | "bathroom" | "evening";
  title: string;
  caption: string;
}

export const DEMO_CABIN = {
  number: "9214",
  type: "balcony" as const,
  views: [
    { id: "bedroom", title: "Bedroom", caption: "Queen bed facing the glass door, so the first thing you see each morning is the sea." },
    { id: "balcony", title: "Balcony", caption: "Two loungers and a small table: room for coffee at sunrise or a quiet sail-away." },
    { id: "bathroom", title: "Bathroom", caption: "Compact en-suite with a glass-walled shower, vanity and plenty of shelf space." },
    { id: "evening", title: "Evening", caption: "Lights low, curtains open: the wake glowing behind the ship after dinner." },
  ] as CabinView[],
};

export const AMENITIES: { name: string; deck: number; blurb: string }[] = [
  { name: "Lido pool", deck: 11, blurb: "Main pool with loungers and shade sails." },
  { name: "Thermal suite & spa", deck: 12, blurb: "Heated loungers, steam room and treatment rooms." },
  { name: "Fitness studio", deck: 12, blurb: "Cardio with sea views and a class studio." },
  { name: "Tidewater Theatre", deck: 4, blurb: "Evening shows and destination talks." },
  { name: "Observation lounge", deck: 14, blurb: "Forward-facing windows for scenic arrivals." },
  { name: "Kids' splash zone", deck: 11, blurb: "Shallow play area for families." },
  { name: "Promenade", deck: 6, blurb: "A wraparound walking deck, about three laps to a mile." },
  { name: "Shore Excursions desk", deck: 5, blurb: "Where ShoreMigo bookings would sync with the ship (concept)." },
];
